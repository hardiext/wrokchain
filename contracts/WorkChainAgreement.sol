// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WorkChainAgreement {
    enum ProjectStatus { Created, Active, Completed, Disputed }
    enum MilestoneStatus { Pending, Submitted, Approved }

    struct Milestone {
        string title;
        uint256 amount;
        MilestoneStatus status;
        string submissionProofHash;
    }

    struct Project {
        uint256 id;
        address client;
        address worker;
        string agreementHash;
        uint256 totalBudget;
        uint256 milestoneCount;
        ProjectStatus status;
        bool workerAccepted;
        uint256 createdAt;
        uint256 completedAt;
    }

    uint256 public projectCounter;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(uint256 => Milestone)) public projectMilestones;

    event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed worker, string agreementHash);
    event AgreementAccepted(uint256 indexed projectId, address indexed worker);
    event MilestoneSubmitted(uint256 indexed projectId, uint256 indexed milestoneIndex, string submissionProofHash);
    event MilestoneApproved(uint256 indexed projectId, uint256 indexed milestoneIndex, uint256 amountPaid);
    event ProjectCompleted(uint256 indexed projectId, uint256 completedAt);
    event DisputeRaised(uint256 indexed projectId, address indexed initiator);

    modifier onlyClient(uint256 _projectId) {
        require(msg.sender == projects[_projectId].client, "Unauthorized: Only Client");
        _;
    }

    modifier onlyWorker(uint256 _projectId) {
        require(msg.sender == projects[_projectId].worker, "Unauthorized: Only Worker");
        _;
    }

    function createProject(
        address _worker,
        string calldata _agreementHash,
        string[] calldata _titles,
        uint256[] calldata _amounts
    ) external payable returns (uint256) {
        require(_worker != address(0) && _worker != msg.sender, "Invalid worker address");
        require(_titles.length == _amounts.length && _titles.length > 0, "Invalid milestone data");

        uint256 total = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            total += _amounts[i];
        }
        require(msg.value == total, "Deposit mismatch with milestone sum");

        projectCounter++;
        uint256 newId = projectCounter;

        projects[newId] = Project({
            id: newId,
            client: msg.sender,
            worker: _worker,
            agreementHash: _agreementHash,
            totalBudget: msg.value,
            milestoneCount: _titles.length,
            status: ProjectStatus.Created,
            workerAccepted: false,
            createdAt: block.timestamp,
            completedAt: 0
        });

        for (uint256 i = 0; i < _titles.length; i++) {
            projectMilestones[newId][i] = Milestone({
                title: _titles[i],
                amount: _amounts[i],
                status: MilestoneStatus.Pending,
                submissionProofHash: ""
            });
        }

        emit ProjectCreated(newId, msg.sender, _worker, _agreementHash);
        return newId;
    }

    function acceptAgreement(uint256 _projectId) external onlyWorker(_projectId) {
        Project storage proj = projects[_projectId];
        require(proj.status == ProjectStatus.Created, "Invalid project state");
        require(!proj.workerAccepted, "Already accepted");

        proj.workerAccepted = true;
        proj.status = ProjectStatus.Active;

        emit AgreementAccepted(_projectId, msg.sender);
    }

    function submitMilestone(
        uint256 _projectId,
        uint256 _milestoneIndex,
        string calldata _proofHash
    ) external onlyWorker(_projectId) {
        Project storage proj = projects[_projectId];
        require(proj.status == ProjectStatus.Active, "Project not active");
        require(_milestoneIndex < proj.milestoneCount, "Milestone index out of bounds");

        Milestone storage m = projectMilestones[_projectId][_milestoneIndex];
        require(m.status != MilestoneStatus.Approved, "Already approved");

        m.status = MilestoneStatus.Submitted;
        m.submissionProofHash = _proofHash;

        emit MilestoneSubmitted(_projectId, _milestoneIndex, _proofHash);
    }

    function approveMilestone(
        uint256 _projectId,
        uint256 _milestoneIndex
    ) external onlyClient(_projectId) {
        Project storage proj = projects[_projectId];
        require(proj.status == ProjectStatus.Active, "Project not active");
        require(_milestoneIndex < proj.milestoneCount, "Milestone index out of bounds");

        Milestone storage m = projectMilestones[_projectId][_milestoneIndex];
        require(m.status == MilestoneStatus.Submitted, "Milestone not submitted");

        m.status = MilestoneStatus.Approved;
        uint256 payout = m.amount;

        (bool sent, ) = payable(proj.worker).call{value: payout}("");
        require(sent, "Payout transfer failed");

        emit MilestoneApproved(_projectId, _milestoneIndex, payout);

        bool allFinished = true;
        for (uint256 i = 0; i < proj.milestoneCount; i++) {
            if (projectMilestones[_projectId][i].status != MilestoneStatus.Approved) {
                allFinished = false;
                break;
            }
        }

        if (allFinished) {
            proj.status = ProjectStatus.Completed;
            proj.completedAt = block.timestamp;
            emit ProjectCompleted(_projectId, proj.completedAt);
        }
    }

    function getMilestone(uint256 _projectId, uint256 _index) external view returns (
        string memory title,
        uint256 amount,
        MilestoneStatus status,
        string memory submissionProofHash
    ) {
        Milestone memory m = projectMilestones[_projectId][_index];
        return (m.title, m.amount, m.status, m.submissionProofHash);
    }
}