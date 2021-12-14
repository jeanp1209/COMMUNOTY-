export enum ExternalEditor {
  Atom = 'Atom',
  VisualStudioCode = 'Visual Studio Code',
  SublimeText = 'Sublime Text',
}

export function parse(label: string): ExternalEditor | null {
  if (label === ExternalEditor.Atom) {
    return ExternalEditor.Atom
  }

  if (label === ExternalEditor.VisualStudioCode) {
    return ExternalEditor.VisualStudioCode
  }

  if (label === ExternalEditor.SublimeText) {
    return ExternalEditor.SublimeText
  }

  return null
}
