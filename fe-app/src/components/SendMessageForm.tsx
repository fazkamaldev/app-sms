import { useState, type FormEvent } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'

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
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="mt-4" style={{ maxWidth: '32rem' }}>
      <Card.Body>
        <Card.Title className="mb-4">Send Message</Card.Title>

        {submitted && (
          <Alert variant="success" onClose={() => setSubmitted(false)} dismissible>
            Message sent to {STAFF_OPTIONS.find((s) => s.value === fromStaff)?.label}.
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

          <Button type="submit" variant="primary">
            Send Message
          </Button>
        </Form>
      </Card.Body>
    </Card>
  )
}
