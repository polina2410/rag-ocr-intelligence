import { useParams } from 'react-router-dom'

const RaceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  return <h1>Race Detail: {id}</h1>
}

export default RaceDetailPage