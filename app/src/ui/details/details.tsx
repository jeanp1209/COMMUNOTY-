import * as React from 'react'

export const Details: React.SFC<{
  readonly summary: JSX.IntrinsicElements['summary']
  readonly open?: boolean
}> = props => {
  return (
    <details className="details" open={props.open}>
      {props.summary}
      {props.children}
    </details>
  )
}
