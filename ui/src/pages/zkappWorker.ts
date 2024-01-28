import { Mina, PublicKey, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { Whisper } from '../../../contracts/src/Whisper';
import { Prover, Checker, MessageDetails } from '../../../contracts/src/Prover';

const state = {
  Whisper: null as null | typeof Whisper,
  Prover: null as null | typeof Prover,
  Checker: null as null | typeof Checker,
  MessageDetails: null as null | typeof MessageDetails,
  zkapp: null as null | Whisper,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql'
    );
    console.log('Berkeley Instance Created');
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { Whisper } = await import('../../../contracts/build/src/Whisper.js');
    const { Prover, Checker, MessageDetails } = await import('../../../contracts/build/src/Prover.js');

    state.Whisper = Whisper;
    state.Prover = Prover;
    state.Checker = Checker;
    state.MessageDetails = MessageDetails;
  },
  compileContract: async (args: {}) => {
    await state.Whisper!.compile();
  },
  baseCase: async (args: { checker: Checker }) => {
    return await Prover.baseCase(args.checker);
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.Whisper!(publicKey);
  },
  getNum: async (args: {}) => {
    const currentNum = await state.zkapp!.pka.get();
    return JSON.stringify(currentNum.toJSON());
  },
  createUpdateTransaction: async (args: {}) => {
    const transaction = await Mina.transaction(() => {
      // state.zkapp!.keyAgreement();
    });
    state.transaction = transaction;
  },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== 'undefined') {
  addEventListener(
    'message',
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}

console.log('Web Worker Successfully Initialized.');