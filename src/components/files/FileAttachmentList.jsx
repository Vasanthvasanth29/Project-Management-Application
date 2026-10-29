import React from 'react';
import { Paperclip } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { FileItem } from './FileItem';
import { useAuthStore } from '../../store/authStore';
import { canUploadFiles } from '../../utils/roleUtils';
export const FileAttachmentList = ({ files, onUploadClick, canDelete = true, onVersionHistory, }) => {
    const { currentUser } = useAuthStore();
    const userRole = currentUser?.role || 'MEMBER';
    const canUpload = canUploadFiles(userRole);
    if (files.length === 0) {
        return (<EmptyState icon={Paperclip} title="No attachments" description="Upload files to attach them to this task." action={onUploadClick && canUpload ? { label: 'Attach File', onClick: onUploadClick } : undefined}/>);
    }
    return (<div className="space-y-2">
      {files.map((record) => (<FileItem key={record.id} record={record} canDelete={canDelete} onVersionHistory={onVersionHistory}/>))}
    </div>);
};
