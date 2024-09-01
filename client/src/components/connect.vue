<template>
  <div class="connect">
    <div class="window">
      <div class="logo" title="coTester.ai">
        <img src="@/assets/images/logo.svg" alt="coTester" />
        <span>coTester</span>
      </div>
      <form class="message" v-if="!connecting">
        <span>Connecting attempt {{ $accessor.connectingAttempts }} of {{ $accessor.maxConnectingAttempts }}</span>
      </form>
      <div class="loader" v-if="connecting">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.connect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba($color: $background-floating, $alpha: 0.8);

  display: flex;
  justify-content: center;
  align-items: center;

  .window {
    width: 300px;
    background: $background-secondary;
    border-radius: 5px;
    padding: 10px;

    .logo {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      cursor: pointer;

      img {
        height: 30px;
        margin-right: 10px;
      }

      span {
        font-size: 30px;
        line-height: 56px;

        b {
          font-weight: 900;
        }
      }
    }

    .message {
      display: flex;
      flex-direction: column;

      span {
        display: block;
        text-align: center;
        text-transform: uppercase;
        line-height: 30px;
      }

      input {
        border: none;
        padding: 6px 8px;
        line-height: 20px;
        border-radius: 5px;
        margin: 5px 0;
        background: $background-tertiary;
        color: $text-normal;

        &::selection {
          background: $text-link;
        }
      }

      button {
        cursor: pointer;
        border-radius: 5px;
        padding: 4px;
        background: $style-primary;
        color: $text-normal;
        text-align: center;
        text-transform: uppercase;
        font-weight: bold;
        line-height: 30px;
        margin: 5px 0;
        border: none;
      }
    }

    .loader {
      width: 90px;
      height: 90px;
      position: relative;
      margin: 0 auto;

      .bounce1,
      .bounce2 {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: $style-primary;
        opacity: 0.6;
        position: absolute;
        top: 0;
        left: 0;

        -webkit-animation: bounce 2s infinite ease-in-out;
        animation: bounce 2s infinite ease-in-out;
      }

      .bounce2 {
        -webkit-animation-delay: -1s;
        animation-delay: -1s;
      }
    }
  }

  @keyframes bounce {

    0%,
    100% {
      transform: scale(0);
      -webkit-transform: scale(0);
    }

    50% {
      transform: scale(1);
      -webkit-transform: scale(1);
    }
  }
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({ name: 'neko-connect' })
export default class extends Vue {
  private autoPassword: string | null = new URL(location.href).searchParams.get('pwd')
  private autoLogin: string | null = new URL(location.href).searchParams.get('usr')

  mounted() {
    window.$log.info('Mounted', this.autoPassword, this.autoLogin);
    // auto-password fill
    if (this.autoPassword !== null) {
      this.$accessor.setPassword(this.autoPassword)
      this.removeUrlParam('pwd')
    }

    // auto-user fill
    if (this.autoLogin !== null) {
      this.$accessor.setDisplayname(this.autoLogin)
      this.removeUrlParam('usr')
    }

    if (this.$accessor.displayname === '' || this.$accessor.password === '') {
      this.$swal({
        title: this.$t('connect.error') as string,
        text: this.$t('connect.empty_displayname') as string,
        icon: 'error',
      })
    } else {
      this.attemptConnecting()
    }
  }

  get connecting() {
    return this.$accessor.connecting
  }
  get connected() {
    return this.$accessor.connected
  }

  attemptConnecting() {
    this.$accessor.login()
    window.$log.info('Login request sent')
    setTimeout(() => {
      this.checkConnectingState()
    }, 500)
  }

  checkConnectingState() {
    if (this.connecting && this.connected) {
      this.$accessor.resetConnectingAttempts();
      window.$log.info('Successfully entered connecting state');
    } else if (this.$accessor.connectingAttempts < this.$accessor.maxConnectingAttempts) {
      this.$accessor.incrementConnectingAttempts();
      window.$log.warn(`Failed to enter connecting state. Retrying... (Attempt ${this.$accessor.connectingAttempts})`);
      setTimeout(() => {
        this.attemptConnecting();
      }, this.$accessor.connectingRetryTimeout);
    } else {
      window.$log.error(new Error('Failed to enter connecting state after multiple attempts'));
      this.$swal({
        title: this.$t('connect.error') as string,
        text: this.$t('connect.connecting_error') as string,
        icon: 'error',
      });
      this.$accessor.resetConnectingAttempts(); // Reset attempts after showing error
    }
  }

  removeUrlParam(param: string) {
    let url = document.location.href
    let urlparts = url.split('?')

    if (urlparts.length >= 2) {
      let urlBase = urlparts.shift()
      let queryString = urlparts.join('?')

      let prefix = encodeURIComponent(param) + '='
      let pars = queryString.split(/[&;]/g)
      for (let i = pars.length; i-- > 0;) {
        if (pars[i].lastIndexOf(prefix, 0) !== -1) {
          pars.splice(i, 1)
        }
      }

      url = urlBase + (pars.length > 0 ? '?' + pars.join('&') : '')
      window.history.pushState('', document.title, url)
    }
  }
}
</script>
