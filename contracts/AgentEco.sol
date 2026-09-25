// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentEco
 * @notice Escrow + settlement + reputation infrastructure for AgentEco MVP.
 *
 * Core flow:
 *
 * CREATED
 *    ↓ fundEscrow (buyer)
 * FUNDED
 *    ↓ startExecution (seller)              [starts executionWindow]
 * EXECUTING
 *    ↓ markDelivered (seller)                [starts reviewWindow]
 *    ↓ or claimExecutionTimeout (anyone, after executionDeadline) → REFUNDED
 * DELIVERED
 *    ↓ acceptAndSettle (buyer)               → SETTLED
 *    ↓ or raiseDispute (buyer, within reviewWindow) → DISPUTED
 *    ↓ or finalizeAfterReviewWindow (anyone, after reviewDeadline) → SETTLED
 * DISPUTED
 *    ↓ resolveDisputeForSeller (arbiter)     → SETTLED
 *    ↓ resolveDisputeForBuyer (arbiter)      → REFUNDED
 *
 * Discovery, negotiation, agent metadata, and task execution
 * remain off-chain.
 *
 * This contract handles the economic state:
 * - escrow funding
 * - delivery confirmation
 * - settlement
 * - refund before execution
 * - execution timeout (seller fails to deliver in time)
 * - post-delivery review window + dispute resolution
 * - on-chain reputation (completed / failed jobs, volume, success rate)
 *
 * Compile with the optimizer enabled (runs = 200) and viaIR = true.
 * Recommended as a safety net even with the split getters below, since
 * any future addition to Escrow/Reputation can reintroduce a
 * "stack too deep" error under the legacy codegen pipeline.
 */
contract AgentEco {

    // =============================================================
    // CONFIGURATION
    // =============================================================

    /**
     * USDT token address for this deployment. Set once at deploy time
     * so the same contract source can be used across testnet/mainnet
     * without editing code.
     */
    address public immutable USDT;

    /**
     * Address allowed to resolve disputes. A single trusted arbiter is
     * a deliberate MVP simplification — swap for a multisig or a
     * decentralized arbitration system before relying on this in
     * production with real value at stake.
     */
    address public arbiter;

    uint256 public constant MIN_WINDOW = 1 hours;
    uint256 public constant MAX_WINDOW = 90 days;

    // =============================================================
    // ENUMS
    // =============================================================

    enum OrderStatus {
        CREATED,
        FUNDED,
        EXECUTING,
        DELIVERED,
        DISPUTED,
        SETTLED,
        REFUNDED
    }

    // =============================================================
    // STRUCTS
    // =============================================================

    struct Escrow {
        uint256 id;

        address buyer;
        address seller;

        uint256 amount;

        OrderStatus status;

        uint256 createdAt;
        uint256 fundedAt;
        uint256 executingAt;
        uint256 deliveredAt;
        uint256 settledAt;

        /**
         * Seconds the seller has to deliver after startExecution().
         * Negotiated off-chain, supplied by the buyer at creation.
         */
        uint256 executionWindow;

        /**
         * Seconds the buyer has to accept or dispute after markDelivered().
         */
        uint256 reviewWindow;

        /// executingAt + executionWindow (0 until execution starts)
        uint256 executionDeadline;

        /// deliveredAt + reviewWindow (0 until delivered)
        uint256 reviewDeadline;

        /**
         * Optional hash of the off-chain result.
         *
         * Example:
         * keccak256(result JSON)
         *
         * The actual result can remain off-chain.
         */
        bytes32 resultHash;
    }

    struct Reputation {
        uint256 completedJobs;
        uint256 failedJobs;
        uint256 totalVolumeSettled;
    }

    // =============================================================
    // STATE
    // =============================================================

    uint256 public nextEscrowId = 1;

    /**
     * Private: no auto-generated single-struct getter (that was the
     * "stack too deep" source). Read escrow data through the
     * getEscrowBasic / getEscrowTimestamps / getEscrowWindows /
     * getResultHash / getEscrowStatus view functions below instead.
     */
    mapping(uint256 => Escrow) private escrows;

    mapping(address => Reputation) public reputations;

    // =============================================================
    // EVENTS
    // =============================================================

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event EscrowFunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event ExecutionStarted(
        uint256 indexed escrowId,
        address indexed seller
    );

    event ResultDelivered(
        uint256 indexed escrowId,
        address indexed seller,
        bytes32 resultHash
    );

    event EscrowSettled(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event ExecutionTimedOut(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed buyer
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed arbiter,
        bool releasedToSeller
    );

    event ReviewFinalized(
        uint256 indexed escrowId
    );

    event ArbiterUpdated(
        address indexed previousArbiter,
        address indexed newArbiter
    );

    // =============================================================
    // MODIFIERS
    // =============================================================

    modifier escrowExists(uint256 escrowId) {
        require(
            escrows[escrowId].buyer != address(0),
            "Escrow does not exist"
        );
        _;
    }

    modifier onlyBuyer(uint256 escrowId) {
        require(
            msg.sender == escrows[escrowId].buyer,
            "Only buyer"
        );
        _;
    }

    modifier onlySeller(uint256 escrowId) {
        require(
            msg.sender == escrows[escrowId].seller,
            "Only seller"
        );
        _;
    }

    modifier onlyArbiter() {
        require(
            msg.sender == arbiter,
            "Only arbiter"
        );
        _;
    }

    // =============================================================
    // CONSTRUCTOR
    // =============================================================

    constructor(address usdtToken, address arbiter_) {
        require(usdtToken != address(0), "Invalid USDT address");
        require(arbiter_ != address(0), "Invalid arbiter");

        USDT = usdtToken;
        arbiter = arbiter_;
    }

    // =============================================================
    // ARBITER MANAGEMENT
    // =============================================================

    /**
     * @notice Transfer the arbiter role to a new address.
     */
    function setArbiter(address newArbiter) external onlyArbiter {
        require(newArbiter != address(0), "Invalid arbiter");

        address previous = arbiter;
        arbiter = newArbiter;

        emit ArbiterUpdated(previous, newArbiter);
    }

    // =============================================================
    // CREATE ESCROW
    // =============================================================

    /**
     * @notice Create a new service escrow.
     *
     * This does NOT move USDT yet.
     *
     * Buyer:
     * Agent D
     *
     * Seller:
     * Agent C
     *
     * Amount:
     * agreed price in USDT base units.
     *
     * Example:
     * 0.18 USDT with 6 decimals = 180000
     *
     * executionWindow / reviewWindow:
     * negotiated off-chain "delivery conditions", in seconds.
     * Bounded to [MIN_WINDOW, MAX_WINDOW] to avoid degenerate values.
     */
    function createEscrow(
        address seller,
        uint256 amount,
        uint256 executionWindow,
        uint256 reviewWindow
    )
        external
        returns (uint256)
    {
        require(
            seller != address(0),
            "Invalid seller"
        );

        require(
            seller != msg.sender,
            "Buyer cannot be seller"
        );

        require(
            amount > 0,
            "Amount must be greater than zero"
        );

        require(
            executionWindow >= MIN_WINDOW && executionWindow <= MAX_WINDOW,
            "Invalid execution window"
        );

        require(
            reviewWindow >= MIN_WINDOW && reviewWindow <= MAX_WINDOW,
            "Invalid review window"
        );

        uint256 escrowId = nextEscrowId;

        nextEscrowId++;

        Escrow storage escrow = escrows[escrowId];
        escrow.id = escrowId;
        escrow.buyer = msg.sender;
        escrow.seller = seller;
        escrow.amount = amount;
        escrow.status = OrderStatus.CREATED;
        escrow.createdAt = block.timestamp;
        escrow.executionWindow = executionWindow;
        escrow.reviewWindow = reviewWindow;

        emit EscrowCreated(
            escrowId,
            msg.sender,
            seller,
            amount
        );

        return escrowId;
    }

    // =============================================================
    // FUND ESCROW
    // =============================================================

    /**
     * @notice Lock buyer's USDT inside the AgentEco contract.
     *
     * Before calling this function, the buyer must approve
     * this contract to spend the required USDT amount.
     *
     * USDT.approve(
     *     AgentEcoAddress,
     *     amount
     * )
     */
    function fundEscrow(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.CREATED,
            "Invalid escrow status"
        );

        _safeTransferFrom(
            USDT,
            msg.sender,
            address(this),
            escrow.amount
        );

        escrow.status = OrderStatus.FUNDED;
        escrow.fundedAt = block.timestamp;

        emit EscrowFunded(
            escrowId,
            msg.sender,
            escrow.amount
        );
    }

    // =============================================================
    // START EXECUTION
    // =============================================================

    /**
     * @notice Seller starts executing the task.
     *
     * FUNDED → EXECUTING, and starts the execution timeout clock.
     */
    function startExecution(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlySeller(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.FUNDED,
            "Escrow not funded"
        );

        escrow.status = OrderStatus.EXECUTING;
        escrow.executingAt = block.timestamp;
        escrow.executionDeadline = block.timestamp + escrow.executionWindow;

        emit ExecutionStarted(
            escrowId,
            msg.sender
        );
    }

    // =============================================================
    // DELIVER RESULT
    // =============================================================

    /**
     * @notice Seller marks the task as delivered.
     *
     * resultHash is optional. For the MVP, the actual result can
     * remain off-chain.
     *
     * Example:
     * resultHash = keccak256(abi.encodePacked(resultJson))
     *
     * A late delivery (past executionDeadline) is still accepted as
     * long as the buyer has not already claimed the timeout refund —
     * whichever action happens first wins.
     */
    function markDelivered(
        uint256 escrowId,
        bytes32 resultHash
    )
        external
        escrowExists(escrowId)
        onlySeller(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.EXECUTING,
            "Not executing"
        );

        escrow.status = OrderStatus.DELIVERED;
        escrow.deliveredAt = block.timestamp;
        escrow.reviewDeadline = block.timestamp + escrow.reviewWindow;
        escrow.resultHash = resultHash;

        emit ResultDelivered(
            escrowId,
            msg.sender,
            resultHash
        );
    }

    // =============================================================
    // EXECUTION TIMEOUT
    // =============================================================

    /**
     * @notice Refund the buyer if the seller never delivered within
     * the agreed executionWindow.
     *
     * Callable by anyone once the deadline has passed, so it can be
     * triggered automatically (a keeper) instead of relying on the
     * buyer to remember to claim it. Counts as a failed job against
     * the seller's reputation.
     */
    function claimExecutionTimeout(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.EXECUTING,
            "Not executing"
        );

        require(
            block.timestamp > escrow.executionDeadline,
            "Execution window not over"
        );

        escrow.status = OrderStatus.REFUNDED;

        _recordFailure(escrow.seller);

        _safeTransfer(
            USDT,
            escrow.buyer,
            escrow.amount
        );

        emit ExecutionTimedOut(
            escrowId,
            escrow.buyer,
            escrow.amount
        );

        emit EscrowRefunded(
            escrowId,
            escrow.buyer,
            escrow.amount
        );
    }

    // =============================================================
    // ACCEPT + SETTLE
    // =============================================================

    /**
     * @notice Buyer accepts the delivered result.
     *
     * This releases the escrowed USDT to the seller.
     *
     * DELIVERED → SETTLED
     */
    function acceptAndSettle(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.DELIVERED,
            "Result not delivered"
        );

        _settle(escrow, escrowId);
    }

    // =============================================================
    // REVIEW WINDOW AUTO-FINALIZE
    // =============================================================

    /**
     * @notice If the buyer neither accepts nor disputes within the
     * reviewWindow, anyone can finalize the escrow and release funds
     * to the seller. Prevents a buyer from withholding payment for
     * delivered work indefinitely.
     */
    function finalizeAfterReviewWindow(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.DELIVERED,
            "Result not delivered"
        );

        require(
            block.timestamp > escrow.reviewDeadline,
            "Review window still open"
        );

        emit ReviewFinalized(escrowId);

        _settle(escrow, escrowId);
    }

    // =============================================================
    // DISPUTES
    // =============================================================

    /**
     * @notice Buyer flags the delivered result as unsatisfactory,
     * within the reviewWindow. Moves the escrow into arbitration.
     */
    function raiseDispute(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.DELIVERED,
            "Result not delivered"
        );

        require(
            block.timestamp <= escrow.reviewDeadline,
            "Review window has passed"
        );

        escrow.status = OrderStatus.DISPUTED;

        emit DisputeRaised(escrowId, msg.sender);
    }

    /**
     * @notice Arbiter resolves the dispute in the seller's favor.
     */
    function resolveDisputeForSeller(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlyArbiter
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.DISPUTED,
            "No active dispute"
        );

        emit DisputeResolved(escrowId, msg.sender, true);

        _settle(escrow, escrowId);
    }

    /**
     * @notice Arbiter resolves the dispute in the buyer's favor.
     * Counts as a failed job against the seller's reputation.
     */
    function resolveDisputeForBuyer(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlyArbiter
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.DISPUTED,
            "No active dispute"
        );

        escrow.status = OrderStatus.REFUNDED;

        _recordFailure(escrow.seller);

        _safeTransfer(
            USDT,
            escrow.buyer,
            escrow.amount
        );

        emit DisputeResolved(escrowId, msg.sender, false);

        emit EscrowRefunded(
            escrowId,
            escrow.buyer,
            escrow.amount
        );
    }

    // =============================================================
    // REFUND (pre-execution)
    // =============================================================

    /**
     * @notice Refund buyer before seller starts execution.
     *
     * IMPORTANT:
     *
     * This unilateral refund is intentionally NOT allowed once
     * execution starts. From EXECUTING onward, the buyer's recourse
     * is claimExecutionTimeout (if the seller stalls) or raiseDispute
     * (if the delivered result is unsatisfactory) — both routed
     * through a deterministic deadline or the arbiter, instead of a
     * unilateral buyer decision.
     */
    function refundEscrow(
        uint256 escrowId
    )
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];

        require(
            escrow.status == OrderStatus.FUNDED,
            "Refund unavailable"
        );

        escrow.status = OrderStatus.REFUNDED;

        _safeTransfer(
            USDT,
            escrow.buyer,
            escrow.amount
        );

        emit EscrowRefunded(
            escrowId,
            escrow.buyer,
            escrow.amount
        );
    }

    // =============================================================
    // INTERNAL SETTLEMENT + REPUTATION HELPERS
    // =============================================================

    function _settle(Escrow storage escrow, uint256 escrowId) internal {
        escrow.status = OrderStatus.SETTLED;
        escrow.settledAt = block.timestamp;

        _recordSuccess(escrow.seller, escrow.amount);

        _safeTransfer(
            USDT,
            escrow.seller,
            escrow.amount
        );

        emit EscrowSettled(
            escrowId,
            escrow.buyer,
            escrow.seller,
            escrow.amount
        );
    }

    function _recordSuccess(address seller, uint256 amount) internal {
        Reputation storage rep = reputations[seller];
        rep.completedJobs += 1;
        rep.totalVolumeSettled += amount;
    }

    function _recordFailure(address seller) internal {
        reputations[seller].failedJobs += 1;
    }

    // =============================================================
    // VIEW FUNCTIONS — ESCROW
    // =============================================================

    /**
     * @notice Buyer, seller, amount, and current status of an escrow.
     */
    function getEscrowBasic(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (
            address buyer,
            address seller,
            uint256 amount,
            OrderStatus status
        )
    {
        Escrow storage escrow = escrows[escrowId];
        return (
            escrow.buyer,
            escrow.seller,
            escrow.amount,
            escrow.status
        );
    }

    /**
     * @notice Lifecycle timestamps of an escrow. A field is 0 until
     * that stage has actually happened.
     */
    function getEscrowTimestamps(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (
            uint256 createdAt,
            uint256 fundedAt,
            uint256 executingAt,
            uint256 deliveredAt,
            uint256 settledAt
        )
    {
        Escrow storage escrow = escrows[escrowId];
        return (
            escrow.createdAt,
            escrow.fundedAt,
            escrow.executingAt,
            escrow.deliveredAt,
            escrow.settledAt
        );
    }

    /**
     * @notice Negotiated windows and their computed deadlines.
     * executionDeadline / reviewDeadline are 0 until execution /
     * delivery has actually started.
     */
    function getEscrowWindows(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (
            uint256 executionWindow,
            uint256 reviewWindow,
            uint256 executionDeadline,
            uint256 reviewDeadline
        )
    {
        Escrow storage escrow = escrows[escrowId];
        return (
            escrow.executionWindow,
            escrow.reviewWindow,
            escrow.executionDeadline,
            escrow.reviewDeadline
        );
    }

    /**
     * @notice Hash of the off-chain delivered result, if any.
     */
    function getResultHash(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (bytes32)
    {
        return escrows[escrowId].resultHash;
    }

    /**
     * @notice Get current escrow status.
     */
    function getEscrowStatus(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (OrderStatus)
    {
        return escrows[escrowId].status;
    }

    /**
     * @notice Whether an EXECUTING escrow has passed its execution
     * deadline and is eligible for claimExecutionTimeout.
     */
    function isExecutionTimedOut(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (bool)
    {
        Escrow storage escrow = escrows[escrowId];
        return escrow.status == OrderStatus.EXECUTING
            && block.timestamp > escrow.executionDeadline;
    }

    /**
     * @notice Whether a DELIVERED escrow has passed its review
     * deadline and is eligible for finalizeAfterReviewWindow.
     */
    function isReviewExpired(
        uint256 escrowId
    )
        external
        view
        escrowExists(escrowId)
        returns (bool)
    {
        Escrow storage escrow = escrows[escrowId];
        return escrow.status == OrderStatus.DELIVERED
            && block.timestamp > escrow.reviewDeadline;
    }

    // =============================================================
    // VIEW FUNCTIONS — REPUTATION / TOKEN
    // =============================================================

    /**
     * @notice Get an agent's on-chain reputation.
     * @return completedJobs Total settled jobs (as seller).
     * @return failedJobs Total jobs lost to timeout or dispute (as seller).
     * @return totalVolumeSettled Cumulative USDT settled (as seller), base units.
     * @return successRateBps Success rate in basis points (10000 = 100%).
     * Divide by 100 for a percentage, e.g. 9630 → 96.30%.
     */
    function getReputation(
        address agent
    )
        external
        view
        returns (
            uint256 completedJobs,
            uint256 failedJobs,
            uint256 totalVolumeSettled,
            uint256 successRateBps
        )
    {
        Reputation memory rep = reputations[agent];
        uint256 totalJobs = rep.completedJobs + rep.failedJobs;
        uint256 rate = totalJobs == 0
            ? 0
            : (rep.completedJobs * 10000) / totalJobs;

        return (
            rep.completedJobs,
            rep.failedJobs,
            rep.totalVolumeSettled,
            rate
        );
    }

    /**
     * @notice Get USDT balance held by AgentEco.
     */
    function getUSDTBalance()
        external
        view
        returns (uint256)
    {
        return IERC20(USDT).balanceOf(
            address(this)
        );
    }

    // =============================================================
    // INTERNAL ERC20 HELPERS
    // =============================================================

    /**
     * @dev Safe ERC20 transfer.
     *
     * Supports tokens that:
     * - return true
     * - return no data
     */
    function _safeTransfer(
        address token,
        address to,
        uint256 amount
    )
        internal
    {
        (bool success, bytes memory data) =
            token.call(
                abi.encodeWithSelector(
                    IERC20.transfer.selector,
                    to,
                    amount
                )
            );

        require(
            success &&
            (
                data.length == 0 ||
                abi.decode(data, (bool))
            ),
            "ERC20 transfer failed"
        );
    }

    /**
     * @dev Safe ERC20 transferFrom.
     */
    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        (bool success, bytes memory data) =
            token.call(
                abi.encodeWithSelector(
                    IERC20.transferFrom.selector,
                    from,
                    to,
                    amount
                )
            );

        require(
            success &&
            (
                data.length == 0 ||
                abi.decode(data, (bool))
            ),
            "ERC20 transferFrom failed"
        );
    }
}

// =============================================================
// MINIMAL ERC20 INTERFACE
// =============================================================

interface IERC20 {

    function transfer(
        address to,
        uint256 amount
    )
        external
        returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        external
        returns (bool);

    function balanceOf(
        address account
    )
        external
        view
        returns (uint256);

    function approve(
        address spender,
        uint256 amount
    )
        external
        returns (bool);

    function allowance(
        address owner,
        address spender
    )
        external
        view
        returns (uint256);
}
