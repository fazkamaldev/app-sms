import { useEffect } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchMe } from '../store/authSlice'
import AppLayout from './AppLayout'

export default function AuthGuard() {
  const dispatch = useAppDispatch()
  const { status, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchMe())
  }, [dispatch])

  useEffect(() => {
    if (status === 'failed') {
      window.location.href = '/login/'
    }
  }, [status])

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading…</span>
        </Spinner>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <AppLayout username={user.username} />
}
