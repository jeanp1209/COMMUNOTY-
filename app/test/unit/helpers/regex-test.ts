import { getCaptures } from '../../../src/lib/helpers/regex'

describe('getCaptures()', () => {
  let bodyOfText: string
  const regex = /(.+):matching:(.+)/gi
  const subject = () => getCaptures(bodyOfText, regex)

  describe('with matches', () => {
    beforeAll(() => {
      bodyOfText = `capture me!:matching:capture me too!\nalso capture me!:matching:also capture me too!\n`
    })
    it('returns all captures', async () => {
      expect(await subject()).toEqual(
        new Set<Array<string>>([
          ['capture me!', 'capture me too!'],
          ['also capture me!', 'also capture me too!'],
        ])
      )
    })
  })
  describe('with no matches', () => {
    beforeAll(() => {
      bodyOfText = ' '
    })
    it('returns empty set', async () => {
      expect(await subject()).toEqual(new Set<Array<string>>())
    })
  })
})
