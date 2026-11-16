import React from 'react';
import { Button, Sheet, Text } from '@/components';

/** Destructive-action confirmation as a bottom sheet. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
  loading,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            title={confirmLabel}
            variant="danger"
            onPress={onConfirm}
            loading={loading}
          />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </>
      }
    >
      <Text color="muted">{message}</Text>
    </Sheet>
  );
}
