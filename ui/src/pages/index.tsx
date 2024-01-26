import { useEffect, useState } from 'react';
import { PublicKey, Field } from 'o1js';
import './reactCOIServiceWorker';
import ZkappWorkerClient from './zkappWorkerClient';

export default function Home() {
    const [accounts, setAccounts] = useState([]);
    const [display, setDisplay] = useState("");

    useEffect(() => {
        (async () => {
            if (accounts.length !== 0) {
                // Show first 6 and last 4 characters of user's Mina account.
                const d = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
                setDisplay(d);
            } else {
              const acs = await window.mina.getAccounts();
              setAccounts(acs);
            }
        })();
    }, [accounts]);

    async function connect_wallet() {
        try {
            // Accounts is an array of string Mina addresses.
            const acs = await window.mina.requestAccounts();
            setAccounts(acs);
        } catch (err) {
            // If the user has a wallet installed but has not created an account, an
            // exception will be thrown. Consider showing "not connected" in your UI.
            console.log(err.message);
        }
    }

  const [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false
  });

  const [displayText, setDisplayText] = useState('');
  const [transactionlink, setTransactionLink] = useState('');

  useEffect(() => {
    async function timeout(seconds: number): Promise<void> {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, seconds * 1000);
      });
    }

    (async () => {
      // Update this to use the address (public key) for your zkApp account.
      // To try it out, you can try this address for an example "Add" smart contract that we've deployed to
      // Berkeley Testnet B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA.
      const zkAppAddress = 'B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA';
      // This should be removed once the zkAppAddress is updated.
      if (!zkAppAddress) {
        console.error(
          'The following error is caused because the zkAppAddress has an empty string as the public key. Update the zkAppAddress with the public key for your zkApp account, or try this address for an example "Add" smart contract that we deployed to Berkeley Testnet: B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA'
        );
      }

      if (!state.hasBeenSetup) {
        setDisplayText('Loading web worker...');
        console.log('Loading web worker...');
        const zkappWorkerClient = new ZkappWorkerClient();
        await timeout(5);

        setDisplayText('Done loading web worker');
        console.log('Done loading web worker');

        await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        console.log(`Using key:${publicKey.toBase58()}`);
        setDisplayText(`Using key:${publicKey.toBase58()}`);

        setDisplayText('Checking if fee payer account exists...');
        console.log('Checking if fee payer account exists...');

        const res = await zkappWorkerClient.fetchAccount({
          publicKey: publicKey!
        });
        const accountExists = res.error == null;

        await zkappWorkerClient.loadContract();

        console.log('Compiling zkApp...');
        setDisplayText('Compiling zkApp...');
        await zkappWorkerClient.compileContract();
        console.log('zkApp compiled');
        setDisplayText('zkApp compiled...');

        const zkappPublicKey = PublicKey.fromBase58(zkAppAddress);

        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        console.log('Getting zkApp state...');
        setDisplayText('Getting zkApp state...');
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
        const currentNum = await zkappWorkerClient.getNum();
        console.log(`Current state in zkApp: ${currentNum.toString()}`);
        setDisplayText('');

        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
          accountExists,
          currentNum
        });
      }

    })();
  }, []);

  return (
    <>
      <div className="flex items-center w-full h-20 px-20">
        <div>
            <h1 className="font-semibold text-xl text-[#023047]">zk-whisper</h1>
        </div>
        <div className="ml-auto">
            {
                (!display) ? <button onClick={connect_wallet} type="button" className="text-[#023047] bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                    <svg aria-hidden="true" className="w-6 h-5 me-2 -ms-1" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="#594AF1"/>
                    <path d="M50.0067 18.1C55.6467 18.1 60.5667 19.21 64.7667 21.43C68.9667 23.65 72.2067 26.95 74.4867 31.33C76.8267 35.65 77.9967 40.9 77.9967 47.08V82H66.2967V65.8H33.5367V82H22.0167V47.08C22.0167 40.9 23.1567 35.65 25.4367 31.33C27.7767 26.95 31.0467 23.65 35.2467 21.43C39.4467 19.21 44.3667 18.1 50.0067 18.1ZM66.2967 55.99V46C66.2967 40.18 64.8567 35.8 61.9767 32.86C59.0967 29.86 55.0767 28.36 49.9167 28.36C44.7567 28.36 40.7367 29.86 37.8567 32.86C34.9767 35.8 33.5367 40.18 33.5367 46V55.99H66.2967Z" fill="white"/>
                    </svg>
                    <span className="mt-1">Connect with Auro</span>
                </button> : <button type="button" className="text-[#023047] bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                    <span className="mt-1">{display}</span>
                </button>
            }
        </div>
      </div>
      <main className="w-full h-full flex flex-col items-center justify-center px-20" style={{ height: "calc(100vh - 5rem)" }}>
        <div className="text-center">
          <h1 className="mb-5 text-2xl font-bold leading-none tracking-tight text-[#023047] md:text-3xl lg:text-5xl dark:text-white">Secure and private messaging with <span className="underline underline-offset-3 decoration-8 decoration-[#594AF1]">zk-whisper</span></h1>
          <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">Here is the most secret and secure way to exchange messages without trusting any system</p>
        </div>
        
        <div className="mt-10 flex items-center justify-center">
          <button type="button" className="inline-flex items-center px-7 py-2.5 text-sm font-medium text-center bg-white text-[#023047] font-bold border-2 border-blue-700 rounded-lg hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            <span className="mt-1">Join an existing chat</span>
          </button>
          <a href="/create-room" className="inline-flex items-center px-7 py-2.5 ml-5 text-sm border-2 border-blue-700 font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            <span className="mt-1">Create a new chat</span>
          </a>
        </div>
      </main>
    </>
  );
}
