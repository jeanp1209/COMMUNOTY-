import * as React from 'react'
import { Octicon, OcticonSymbol } from '../octicons'
import { TextBox, ITextBoxProps } from './text-box'
import * as classNames from 'classnames'

interface IFancyTextBoxProps extends ITextBoxProps {
  readonly symbol: OcticonSymbol
  readonly onRef: (textbox: TextBox) => void
}

interface IFancyTextBoxState {
  readonly isFocused: boolean
}

export class FancyTextBox extends React.Component<
  IFancyTextBoxProps,
  IFancyTextBoxState
> {
  public constructor(props: IFancyTextBoxProps) {
    super(props)

    this.state = { isFocused: false }
  }

  public render() {
    const fancyTextBoxClassNames = classNames(
      'fancy-text-box-component',
      this.props.className,
      { focused: this.state.isFocused }
    )
    const octiconClassNames = classNames('fancy-octicon')

    return (
      <div className={fancyTextBoxClassNames}>
        <Octicon className={octiconClassNames} symbol={this.props.symbol} />
        <TextBox
          value={this.props.value}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          autoFocus={this.props.autoFocus}
          disabled={this.props.disabled}
          type={this.props.type}
          placeholder={this.props.placeholder}
          onKeyDown={this.props.onKeyDown}
          onValueChanged={this.props.onValueChanged}
          tabIndex={this.props.tabIndex}
          ref={this.props.onRef}
        />
      </div>
    )
  }

  private onFocus = () => {
    if (this.props.onFocus !== undefined) {
      this.props.onFocus()
    }

    this.setState({ isFocused: true })
  }

  private onBlur = () => {
    if (this.props.onBlur !== undefined) {
      this.props.onBlur()
    }

    this.setState({ isFocused: false })
  }
}
