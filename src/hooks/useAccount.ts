import { LOCAL_STORAGE } from 'src/config/localStorage';
import { useStore } from 'src/store';
import { SubstrateAccount } from 'src/store/general';
import { computed, ref, watch } from 'vue';

export const useAccount = () => {
  const substrateAddress = ref<string>('');
  const substrateAccountName = ref<string>('');

  const store = useStore();
  const substrateAccounts = computed(() => store.getters['general/substrateAccounts']);
  const substrateAccount = computed(() => store.getters['general/substrateAccount']);
  const { SELECTED_ADDRESS } = LOCAL_STORAGE;

  const disconnectAccount = () => {
    store.commit('general/setCurrentAddress', null);
    substrateAddress.value = '';
    substrateAccountName.value = '';
    localStorage.removeItem(SELECTED_ADDRESS);
  };

  watch(
    [substrateAccount],
    () => {
      if (!substrateAccounts.value) return;
      const account = substrateAccounts.value.find(
        (it: SubstrateAccount) => it.address === substrateAccount.value
      );
      if (account) {
        substrateAddress.value = account.address;
        substrateAccountName.value = account.name;
        localStorage.setItem(SELECTED_ADDRESS, String(substrateAddress.value));
      }
    },
    { immediate: true }
  );

  return {
    substrateAccounts,
    substrateAddress,
    substrateAccountName,
    disconnectAccount,
  };
};
