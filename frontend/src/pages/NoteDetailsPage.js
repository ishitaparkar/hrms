import React from 'react';
import { useParams, Link } from 'react-router-dom';

// NEW, more realistic mock data for a single note
const mockNoteDetails = {
    id: 'N-001',
    title: 'Request for New Conference Speakers',
    initiator: 'Dr. Anjali Rao',
    description: 'Proposal to allocate budget for inviting three guest speakers...',
    submittedDate: '2025-10-25',
    // This approval chain now includes remarks and is more realistic
    approvals: [
        { role: 'Campus Admin', status: 'Approved', date: '2025-10-25', approver: 'Mr. Sharma', remarks: 'Initial check complete. Forwarding to Finance.' },
        { role: 'Finance Officer', status: 'Pending', date: null, approver: null, remarks: null },
        { role: 'Registrar', status: 'Pending', date: null, approver: null, remarks: null },
    ]
};

const NoteDetailsPage = () => {
    const { noteId } = useParams();

    // This function determines the overall status based on the approval chain
    const getOverallStatus = (approvals) => {
        const lastApproved = [...approvals].reverse().find(a => a.status === 'Approved');
        const isRejected = approvals.some(a => a.status === 'Rejected');
        const firstPending = approvals.find(a => a.status === 'Pending');

        if (isRejected) return `Rejected by ${approvals.find(a => a.status === 'Rejected').role}`;
        if (!firstPending) return 'Fully Approved';
        return `Pending ${firstPending.role} Approval`;
    };

    const overallStatus = getOverallStatus(mockNoteDetails.approvals);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{mockNoteDetails.title}</h1>
                    <p className="text-sm text-subtext-light">Submitted by {mockNoteDetails.initiator}</p>
                </div>
                <Link to="/notes-approvals" className="text-primary hover:underline">&larr; Back to List</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Submitted Document</h3>
                    <div className="border rounded-lg p-4 min-h-[600px]">
                        <p className="text-subtext-light">[PDF document viewer would be here]</p>
                        <p className="mt-4">{mockNoteDetails.description}</p>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Approval Chain</h3>
                        <ul className="space-y-4">
                            {mockNoteDetails.approvals.map((approval) => (
                                <ApprovalStep key={approval.role} approval={approval} />
                            ))}
                        </ul>
                    </div>
                    {/* Action buttons for the current user would be here */}
                </div>
            </div>
        </div>
    );
};

// Helper component for a single step in the approval chain
const ApprovalStep = ({ approval }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <span className="material-icons text-green-500">check_circle</span>;
            case 'Pending': return <span className="material-icons text-yellow-500">pending</span>;
            case 'Rejected': return <span className="material-icons text-red-500">cancel</span>;
            default: return null;
        }
    };

    return (
        <li className="flex space-x-4">
            <div>{getStatusIcon(approval.status)}</div>
            <div className="flex-1">
                <p className="font-semibold">{approval.role}</p>
                <p className="text-xs text-subtext-light">
                    {approval.status === 'Pending' ? 'Awaiting approval' : `${approval.status} by ${approval.approver} on ${approval.date}`}
                </p>
                {/* --- NEW: Display Remarks --- */}
                {approval.remarks && (
                    <p className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                        <strong>Remarks:</strong> {approval.remarks}
                    </p>
                )}
            </div>
        </li>
    );
};

export default NoteDetailsPage;