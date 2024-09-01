import Vue from 'vue'
import Vuex from 'vuex'
import { useAccessor, mutationTree, getterTree, actionTree } from 'typed-vuex'
import { EVENT } from '~/neko/events'
import { AdminLockResource } from '~/neko/messages'
import { get, set } from '~/utils/localstorage'

import * as video from './video'
import * as chat from './chat'
import * as files from './files'
import * as remote from './remote'
import * as user from './user'
import * as settings from './settings'
import * as client from './client'
import * as emoji from './emoji'

export const state = () => ({
  displayname: get<string>('displayname', ''),
  password: get<string>('password', ''),
  active: false,
  connecting: false,
  connected: false,
  locked: {} as Record<string, boolean>,
  connectingAttempts: 0,
  maxConnectingAttempts: 3,
  connectingRetryTimeout: 2000,
})

export const mutations = mutationTree(state, {
  setActive(state) {
    state.active = true
  },

  setDisplayname(state, displayname: string) {
    state.displayname = displayname
  },

  setPassword(state, password: string) {
    state.password = password
  },

  setLogin(state, { displayname, password }: { displayname: string; password: string }) {
    state.displayname = displayname
    state.password = password
  },

  setLocked(state, resource: string) {
    Vue.set(state.locked, resource, true)
  },

  setUnlocked(state, resource: string) {
    Vue.set(state.locked, resource, false)
  },

  setConnnecting(state) {
    state.connected = false
    state.connecting = true
  },

  setConnected(state, connected: boolean) {
    state.connected = connected
    state.connecting = false
    if (connected) {
      set('displayname', state.displayname)
      set('password', state.password)
    }
  },

  setConnectingAttempts(state, value: number) {
    state.connectingAttempts = value;
  },
  incrementConnectingAttempts(state) {
    state.connectingAttempts++;
  },
  resetConnectingAttempts(state) {
    state.connectingAttempts = 0;
  },      
})

export const getters = getterTree(state, {
  isLocked: (state) => (resource: AdminLockResource) => resource in state.locked && state.locked[resource],
})

export const actions = actionTree(
  { state, getters, mutations },
  {
    initialise() {
      accessor.emoji.initialise()
      accessor.settings.initialise()
    },

    lock(_, resource: AdminLockResource) {
      if (!accessor.connected || !accessor.user.admin) {
        return
      }

      $client.sendMessage(EVENT.ADMIN.LOCK, { resource })
    },

    unlock(_, resource: AdminLockResource) {
      if (!accessor.connected || !accessor.user.admin) {
        return
      }

      $client.sendMessage(EVENT.ADMIN.UNLOCK, { resource })
    },

    toggleLock(_, resource: AdminLockResource) {
      if (accessor.isLocked(resource)) {
        accessor.unlock(resource)
      } else {
        accessor.lock(resource)
      }
    },

    login() {
      $client.login(accessor.password, accessor.displayname)
    },

    logout() {
      accessor.setLogin({ displayname: '', password: '' })
      set('displayname', '')
      set('password', '')
      $client.logout()
    },
  },
)

export const storePattern = {
  state,
  mutations,
  actions,
  getters,
  modules: { video, chat, files, user, remote, settings, client, emoji },
}

Vue.use(Vuex)

const store = new Vuex.Store(storePattern)
export const accessor = useAccessor(store, storePattern)

Vue.prototype.$accessor = accessor

declare module 'vue/types/vue' {
  interface Vue {
    $accessor: typeof accessor
  }
}

export default store
