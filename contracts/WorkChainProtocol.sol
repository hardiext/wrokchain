// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WorkChainProtocol
 * @notice Sesuai Spec v3.1: Commitments, Deliverable Manifests, & Payment Attestations
 */
contract WorkChainProtocol {
    enum AgreementStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }
    enum CancelReason { NONE, CLIENT_CANCELLED, WORKER_DECLINED, NO_SHOW, UNANSWERED }
    enum MilestoneStatus { PENDING, IN_PROGRESS, SUBMITTED, APPROVED }

    struct Milestone {
        MilestoneStatus status;
        bytes32 deliverableHash;
        bytes32 paymentRef;
        bool paymentConfirmed;
    }

    struct Agreement {
        address client;
        address worker;
        bytes32 termsHash;
        uint256 offerExpiry;
        AgreementStatus status;
        CancelReason cancelReason;
        uint8 currentMilestone;
        uint8 milestoneCount;
        uint256 acceptedAt;
        uint256 completedAt;
        uint256 cancelledAt;
    }

    uint256 public immutable reviewWindowSeconds;
    uint256 public immutable overdueGraceSeconds;
    uint256 public agreementCounter;

    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => mapping(uint8 => Milestone)) public milestones;

    // Events — Terhubung 1-to-1 dengan tabel chain_events
    event AgreementCreated(uint256 indexed agreementId, address indexed client, address indexed worker, bytes32 termsHash, uint256 offerExpiry, uint8 milestoneCount);
    event AgreementAccepted(uint256 indexed agreementId, address indexed worker, uint256 timestamp);
    event AgreementCancelled(uint256 indexed agreementId, CancelReason reason, uint256 timestamp);
    event AgreementCompleted(uint256 indexed agreementId, uint256 timestamp);
    event MilestoneStarted(uint256 indexed agreementId, uint8 indexed milestoneIdx, uint256 timestamp);
    event MilestoneSubmitted(uint256 indexed agreementId, uint8 indexed milestoneIdx, bytes32 manifestHash, uint256 timestamp);
    event MilestoneApproved(uint256 indexed agreementId, uint8 indexed milestoneIdx, uint256 timestamp);
    event PaymentAttested(uint256 indexed agreementId, uint8 indexed milestoneIdx, bytes32 paymentRef, address indexed attestedBy);
    event PaymentConfirmed(uint256 indexed agreementId, uint8 indexed milestoneIdx, bytes32 paymentRef, uint256 timestamp);

    constructor(uint256 _reviewWindow, uint256 _overdueGrace) {
        reviewWindowSeconds = _reviewWindow > 0 ? _reviewWindow : 7 days;
        overdueGraceSeconds = _overdueGrace > 0 ? _overdueGrace : 14 days;
    }

    function createAgreement(address _worker, bytes32 _termsHash, uint256 _offerExpiry, uint8 _milestoneCount) external returns (uint256) {
        require(_worker != address(0) && _worker != msg.sender, "Invalid worker");
        require(_milestoneCount > 0 && _milestoneCount <= 10, "1-10 milestones");
        require(_offerExpiry > block.timestamp, "Expiry in past");

        agreementCounter++;
        uint256 id = agreementCounter;

        agreements[id] = Agreement({
            client: msg.sender,
            worker: _worker,
            termsHash: _termsHash,
            offerExpiry: _offerExpiry,
            status: AgreementStatus.PENDING,
            cancelReason: CancelReason.NONE,
            currentMilestone: 0,
            milestoneCount: _milestoneCount,
            acceptedAt: 0,
            completedAt: 0,
            cancelledAt: 0
        });

        emit AgreementCreated(id, msg.sender, _worker, _termsHash, _offerExpiry, _milestoneCount);
        return id;
    }

    function acceptAgreement(uint256 _id) external {
        Agreement storage a = agreements[_id];
        require(msg.sender == a.worker, "Only worker");
        require(a.status == AgreementStatus.PENDING, "Not pending");
        require(block.timestamp <= a.offerExpiry, "Offer expired");

        a.status = AgreementStatus.ACTIVE;
        a.acceptedAt = block.timestamp;
        milestones[_id][0].status = MilestoneStatus.IN_PROGRESS;

        emit AgreementAccepted(_id, msg.sender, block.timestamp);
        emit MilestoneStarted(_id, 0, block.timestamp);
    }

    function submitMilestone(uint256 _id, uint8 _idx, bytes32 _manifestHash) external {
        Agreement storage a = agreements[_id];
        require(msg.sender == a.worker, "Only worker");
        require(a.status == AgreementStatus.ACTIVE, "Not active");
        require(_idx == a.currentMilestone, "Not current milestone");

        Milestone storage m = milestones[_id][_idx];
        m.status = MilestoneStatus.SUBMITTED;
        m.deliverableHash = _manifestHash;

        emit MilestoneSubmitted(_id, _idx, _manifestHash, block.timestamp);
    }

    function approveMilestone(uint256 _id, uint8 _idx) external {
        Agreement storage a = agreements[_id];
        require(msg.sender == a.client, "Only client");
        require(a.status == AgreementStatus.ACTIVE, "Not active");
        require(_idx == a.currentMilestone, "Not current milestone");

        Milestone storage m = milestones[_id][_idx];
        require(m.status == MilestoneStatus.SUBMITTED, "Not submitted");

        m.status = MilestoneStatus.APPROVED;
        emit MilestoneApproved(_id, _idx, block.timestamp);

        if (_idx + 1 < a.milestoneCount) {
            a.currentMilestone = _idx + 1;
            milestones[_id][_idx + 1].status = MilestoneStatus.IN_PROGRESS;
            emit MilestoneStarted(_id, _idx + 1, block.timestamp);
        } else {
            a.status = AgreementStatus.COMPLETED;
            a.completedAt = block.timestamp;
            emit AgreementCompleted(_id, block.timestamp);
        }
    }

    function attestPayment(uint256 _id, uint8 _idx, bytes32 _paymentRef) external {
        Agreement storage a = agreements[_id];
        require(msg.sender == a.client || msg.sender == a.worker, "Not participant");
        Milestone storage m = milestones[_id][_idx];
        require(m.status == MilestoneStatus.APPROVED, "Not approved yet");
        require(m.paymentRef == bytes32(0), "Already attested");

        m.paymentRef = _paymentRef;
        emit PaymentAttested(_id, _idx, _paymentRef, msg.sender);
    }

    function confirmPayment(uint256 _id, uint8 _idx) external {
        Agreement storage a = agreements[_id];
        require(msg.sender == a.worker, "Only worker confirms");
        Milestone storage m = milestones[_id][_idx];
        require(m.paymentRef != bytes32(0), "Not attested");
        require(!m.paymentConfirmed, "Already confirmed");

        m.paymentConfirmed = true;
        emit PaymentConfirmed(_id, _idx, m.paymentRef, block.timestamp);
    }
}