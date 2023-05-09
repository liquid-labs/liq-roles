/* global describe expect test */

import { rankAccessType, ORDERED_ACCESS_TYPE } from '../roles-access-lib'

describe('rankAccessType', () => {
  const testArray = ORDERED_ACCESS_TYPE.map((t, i) => [ t, i ])

  test.each(testArray)('%s has rank %i', (type, expectedRank) => expect(rankAccessType(type)).toBe(expectedRank))

  test("invalid access type 'foo bar' results in an exception", () => expect(() => rankAccessType('foo bar')).toThrow())
})