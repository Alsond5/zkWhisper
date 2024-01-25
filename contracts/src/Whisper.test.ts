import { g, Whisper } from "./Whisper"
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, MerkleMap, Poseidon } from 'o1js';

let proofsEnabled = false;

function powermod(base: bigint, exp: bigint, p: bigint): Field {
    var result = 1n;

    while (exp !== 0n) {
      if (exp % 2n === 1n) result = result * base % p;
      base = base * base % p;
      exp >>= 1n;
    }

    return Field(result);
}

describe('Whisper', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Whisper,
    merkleMap: MerkleMap,
    p: bigint

  beforeAll(async () => {
    p = Field.ORDER;
    merkleMap = new MerkleMap();

    if (proofsEnabled) await Whisper.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Whisper(zkAppAddress);

    merkleMap.set(Poseidon.hash(deployerAccount.toFields()), Field(2n));
    merkleMap.set(Poseidon.hash(senderAccount.toFields()), Field(2n));
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }
  
  async function initialize() {
    const pka = powermod(g, deployerKey.toBigInt(), p);

    const root = merkleMap.getRoot();

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.initState(pka, root);
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();

    return pka;
  }

  it('generates and deploys the `Add` smart contract', async () => {
    await localDeploy();
    const pka = await initialize();

    const contract_pka = zkApp.pka.get();
    expect(contract_pka).toEqual(pka);
  });

  it('Accurately updates the pkb state in the `Whisper` smart contract and completes key exchange', async () => {
    await localDeploy();
    const pka = await initialize();

    const witness = merkleMap.getWitness(Poseidon.hash(senderAccount.toFields()));
    const pkb = powermod(g, senderKey.toBigInt(), p);

    const common_key = powermod(pka.toBigInt(), senderKey.toBigInt(), p);
    const common_pk = PrivateKey.fromBigInt(common_key.toBigInt());
    const common_puk = common_pk.toPublicKey();

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.keyAgreement(witness, pkb, common_puk);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const pkb_state = zkApp.pkb.get();

    const common_key2 = powermod(pkb_state.toBigInt(), deployerKey.toBigInt(), p);
    const common_pk2 = PrivateKey.fromBigInt(common_key2.toBigInt());
    const common_puk2 = common_pk2.toPublicKey();

    const state_puk = zkApp.publicKey.get();
    
    expect(pkb_state).toEqual(pkb);
    expect(state_puk).toEqual(common_puk);
    expect(common_puk).toEqual(common_puk2);
  });
});