import { useCallback, useEffect, useReducer } from 'react'
import { OrdersService } from '@/api/orders'
import { ReviewsService } from '@/api/reviews'
import type { ReviewSubjectType } from '@/api/reviews'

const MAX_PHOTOS = 5
const MAX_PER_REQUEST = 5

export interface SubjectForm {
  subjectType: ReviewSubjectType
  subjectId: string
  orderId: string
  label: string
  thumbnail: string | null
  rating: number
  comment: string
  files: File[]
}

type State = {
  subjects: SubjectForm[]
  loading: boolean
  error: string | null
  busy: boolean
  submittedIds: string[]
  subjectErrors: Record<string, string>
}

type Action =
  | { type: 'loading' }
  | { type: 'success'; subjects: SubjectForm[] }
  | { type: 'error'; message: string }
  | { type: 'setRating'; subjectId: string; rating: number }
  | { type: 'setComment'; subjectId: string; comment: string }
  | { type: 'addFiles'; subjectId: string; files: File[] }
  | { type: 'removeFile'; subjectId: string; index: number }
  | { type: 'submitStart' }
  | { type: 'submitDone'; subjectId: string }
  | { type: 'submitFail'; subjectId: string; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'success':
      return { ...state, subjects: action.subjects, loading: false, error: null }
    case 'error':
      return { ...state, loading: false, error: action.message }
    case 'setRating':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.subjectId === action.subjectId ? { ...s, rating: action.rating } : s,
        ),
      }
    case 'setComment':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.subjectId === action.subjectId ? { ...s, comment: action.comment } : s,
        ),
      }
    case 'addFiles':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.subjectId === action.subjectId
            ? { ...s, files: [...s.files, ...action.files].slice(0, MAX_PHOTOS) }
            : s,
        ),
      }
    case 'removeFile':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.subjectId === action.subjectId
            ? { ...s, files: s.files.filter((_, i) => i !== action.index) }
            : s,
        ),
      }
    case 'submitStart':
      return { ...state, busy: true }
    case 'submitDone':
      return {
        ...state,
        busy: false,
        submittedIds: [...state.submittedIds, action.subjectId],
        subjectErrors: Object.fromEntries(
          Object.entries(state.subjectErrors).filter(([k]) => k !== action.subjectId),
        ),
      }
    case 'submitFail':
      return {
        ...state,
        busy: false,
        subjectErrors: { ...state.subjectErrors, [action.subjectId]: action.message },
      }
  }
}

const initial: State = {
  subjects: [],
  loading: false,
  error: null,
  busy: false,
  submittedIds: [],
  subjectErrors: {},
}

export function useReviewForm(orderId: string | null) {
  const [state, dispatch] = useReducer(reducer, initial)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    dispatch({ type: 'loading' })

    const load = async () => {
      try {
        const [allowedResult, order] = await Promise.all([
          ReviewsService.getApiReviewsReviewsAllowed({ page: 1, pageSize: 100 }),
          OrdersService.getApiOrdersOrders({ id: orderId }),
        ])

        if (cancelled) return

        const pending = (allowedResult.items ?? []).filter((s) => s.orderId === orderId)

        if (pending.length === 0) {
          dispatch({ type: 'error', message: 'already_reviewed' })
          return
        }

        const subjects: SubjectForm[] = pending.map((s) => {
          const subjectType = s.subjectType!
          const subjectId = s.subjectId!
          let label = ''
          let thumbnail: string | null = null

          if (subjectType === 'Product') {
            const item = (order.items ?? []).find((i) => i.productId === subjectId)
            label = item?.productName ?? 'Товар'
            thumbnail = item?.mainPhotoUrl ?? null
          } else if (subjectType === 'Seller') {
            label = order.sellerName ?? order.shopName ?? 'Продавец'
          } else if (subjectType === 'Courier') {
            label = order.courierAssignment?.courierName ?? 'Курьер'
          }

          return {
            subjectType,
            subjectId,
            orderId,
            label,
            thumbnail,
            rating: 0,
            comment: '',
            files: [],
          }
        })

        dispatch({ type: 'success', subjects })
      } catch {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить данные' })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const setRating = useCallback((subjectId: string, rating: number) => {
    dispatch({ type: 'setRating', subjectId, rating })
  }, [])

  const setComment = useCallback((subjectId: string, comment: string) => {
    dispatch({ type: 'setComment', subjectId, comment })
  }, [])

  const addFiles = useCallback((subjectId: string, files: File[]) => {
    dispatch({ type: 'addFiles', subjectId, files })
  }, [])

  const removeFile = useCallback((subjectId: string, index: number) => {
    dispatch({ type: 'removeFile', subjectId, index })
  }, [])

  const submitOne = useCallback(
    async (subjectId: string): Promise<boolean> => {
      const subject = state.subjects.find((s) => s.subjectId === subjectId)
      if (!subject) return false

      if (subject.rating === 0) {
        dispatch({ type: 'submitFail', subjectId, message: 'Поставьте оценку' })
        return false
      }

      dispatch({ type: 'submitStart' })

      try {
        const review = await ReviewsService.postApiReviewsReviews({
          requestBody: {
            orderId: subject.orderId,
            subjectType: subject.subjectType,
            subjectId: subject.subjectId,
            subjectName: subject.label,
            rating: subject.rating,
            comment: subject.comment.trim() || null,
          },
        })

        if (subject.files.length > 0 && review.id) {
          for (let i = 0; i < subject.files.length; i += MAX_PER_REQUEST) {
            const batch = subject.files.slice(i, i + MAX_PER_REQUEST) as Blob[]
            await ReviewsService.postApiReviewsReviewsPhotos({
              id: review.id,
              formData: { images: batch },
            })
          }
        }

        dispatch({ type: 'submitDone', subjectId })
        return true
      } catch {
        dispatch({ type: 'submitFail', subjectId, message: 'Не удалось отправить отзыв' })
        return false
      }
    },
    [state.subjects],
  )

  const allDone = state.subjects.length > 0 && state.submittedIds.length === state.subjects.length

  return {
    subjects: state.subjects,
    loading: state.loading,
    error: state.error,
    busy: state.busy,
    submittedIds: state.submittedIds,
    subjectErrors: state.subjectErrors,
    allDone,
    setRating,
    setComment,
    addFiles,
    removeFile,
    submitOne,
  }
}
