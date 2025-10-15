import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ServiceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export const ServiceDeleteDialog: React.FC<ServiceDeleteDialogProps> = ({ open, onOpenChange, onConfirm }) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Service"
      description="Are you sure you want to delete this service? This action cannot be undone."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      {/* You can add any content here if needed */}
      {/* For now, just an empty fragment */}
      <>
      </>
    </Modal>
  );
};