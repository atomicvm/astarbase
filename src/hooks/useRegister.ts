import { useStore } from 'src/store';
import { computed } from 'vue';
import { Contract } from 'web3-eth-contract';
import { stringToHex } from '@polkadot/util';
import { getInjector } from 'src/modules/wallet/utils';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const signMessage = stringToHex('Sign this to register to AstarBase for:');
const PREFIX = '3c42797465733e';
const POSTFIX = '3c2f42797465733e';
const GAS_PRICE = '10000000000';
const GAS_LIMIT = '300000';

export const useRegister = () => {
  const store = useStore();
  const registerContract = computed(() => store.getters['general/registerContract']);
  const astarBaseContractAddress = computed(
    () => store.getters['general/astarBaseContractAddress']
  );
  const account = computed(() => store.getters['general/ethereumAccount']);
  const substrateAccounts = computed(() => store.getters['general/substrateAccounts']);
  const substrateAccount = computed(() => store.getters['general/substrateAccount']);

  // Todo: Modify the logic once contract has been finalized
  const register = async () => {
    const contract = registerContract.value as Contract;
    const injector = await getInjector(substrateAccounts.value);
    const address = substrateAccount.value;

    const publicKey = decodeAddress(substrateAccount.value, undefined, 5);
    const hexPublicKey: string = (window as any).ecdsaPublicKey || u8aToHex(publicKey);

    const signData =
      PREFIX + signMessage.slice(2) + hexPublicKey.slice(2) + account.value.slice(2) + POSTFIX;

    console.log(`Native account: ${substrateAccount.value}`);
    console.log(`H160 address: ${account.value}`);
    console.log(`signData: 0x${signData}`);

    const result = await injector.signer.signRaw({
      address,
      data: `0x${signData}`,
      type: 'bytes',
    });

    console.log(`hexPublicKey: ${hexPublicKey}`);
    console.log('signature', result.signature);

    store.commit('general/setLoading', true);
    contract.methods
      .register(hexPublicKey, result.signature)
      .send({
        to: astarBaseContractAddress.value,
        from: account.value,
        gasLimit: GAS_LIMIT,
        gasPrice: GAS_PRICE,
      })
      .once('error', (err: any) => {
        console.error(err);
        const message = err.reason || err.message;
        store.commit('general/setError', message);
        store.commit('general/setLoading', false);
      })
      .then((receipt: any) => {
        console.log(receipt);
        store.commit('general/changeIsRegistered', true);
        store.commit('general/setLoading', false);
      });
  };

  return {
    register,
  };
};
