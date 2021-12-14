import * as React from 'react'
import { Details } from './details'

export const DetailsList: React.SFC<{
  readonly details: ReadonlyArray<typeof Details>
}> = props => {
  let key = 0
  const items = props.details.map(d => <li key={key++}>{d}</li>)
  return <ol>{items}</ol>
}
