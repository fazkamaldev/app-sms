import { useState, type FormEvent } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

const STAFF_OPTIONS = [
  { value: '', label: 'Select staff member' },
  { value: 'alice', label: 'Alice Johnson' },
  { value: 'bob', label: 'Bob Smith' },
  { value: 'carol', label: 'Carol Williams' },
]

export default function SendMessageForm() {
  const [fromStaff, setFromStaff] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const staffLabel = STAFF_OPTIONS.find((s) => s.value === fromStaff)?.label

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setShowConfirm(true)
  }

  async function handleConfirmSend() {
    setShowConfirm(false)
    setLoading(true)
    setSuccess(null)
    setError(null)

    try {
      const res = await fetch('/api/app/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          from_staff: fromStaff,
          mobile_no: mobileNo,
          message,
        }),
      })

      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || 'Failed to send message')
      }

      setSuccess(`Message sent via ${staffLabel}.`)
      setMobileNo('')
      setMessage('')
      setFromStaff('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="mt-4" style={{ maxWidth: '32rem' }}>
        <Card.Body>
          <Card.Title className="mb-4">Send Message</Card.Title>

          {success && (
            <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="fromStaff">
              <Form.Label>From Staff</Form.Label>
              <Form.Select
                value={fromStaff}
                onChange={(e) => setFromStaff(e.target.value)}
                required
              >
                {STAFF_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} disabled={!option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="mobileNo">
              <Form.Label>Mobile No</Form.Label>
              <Form.Control
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="e.g. 0412 345 678"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="message">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send Message'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Send</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Send this message to <strong>{mobileNo}</strong> from <strong>{staffLabel}</strong>?</p>
          <p className="text-muted mb-0">{message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            No
          </Button>
          <Button variant="primary" onClick={handleConfirmSend}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
