import * as chai from 'chai'
const expect = chai.expect

import { Account } from '../../src/models/account'
import { AccountsStore } from '../../src/lib/dispatcher'
import { InMemoryStore } from '../in-memory-store'
import { AsyncInMemoryStore } from '../async-in-memory-store'

describe('AccountsStore', () => {
  let accountsStore: AccountsStore | null = null
  beforeEach(() => {
    accountsStore = new AccountsStore(
      new InMemoryStore(),
      new AsyncInMemoryStore()
    )
  })

  describe('adding a new user', () => {
    it('contains the added user', async () => {
      const newAccountLogin = 'joan'
      await accountsStore!.addAccount(
        new Account(newAccountLogin, '', 'deadbeef', [], '', 1, '')
      )

      const users = await accountsStore!.getAll()
      expect(users[0].login).to.equal(newAccountLogin)
    })
  })
})
