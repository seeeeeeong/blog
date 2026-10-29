import { Modal } from '@/features/admin/components/Modal'

type Props = {
  open: boolean
  /** The post is already out, and this replaces what readers see. */
  republish: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function PublishDialog({ open, republish, onCancel, onConfirm }: Props) {
  return (
    <Modal
      open={open}
      eyebrow={republish ? 'Republish' : 'Publish'}
      title={republish ? '다시 발행할까요?' : '발행할까요?'}
      onClose={onCancel}
    >
      <p>발행하면 새 리비전이 남고, 바로 사이트에 보입니다.</p>
      <div className="modal__foot">
        <button className="pill" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="pill pill--accent" type="button" onClick={onConfirm}>
          {republish ? 'Republish' : 'Publish'}
        </button>
      </div>
    </Modal>
  )
}
