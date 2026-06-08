import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

interface AuthUser {
  username: string
}

interface AuthState {
  user: AuthUser | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
}

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (!res.ok) {
    throw new Error('Unauthorized')
  }
  return (await res.json()) as AuthUser
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = 'failed'
        state.user = null
      })
  },
})

export default authSlice.reducer
