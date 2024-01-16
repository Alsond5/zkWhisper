import { Whisper, g } from './Whisper.js';
import {
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
  MerkleMap,
  Poseidon,
  Bool,
  Encryption,
  CircuitString,
  Signature
} from 'o1js';
import { Prover, Checker, MessageDetails } from "./Prover.js"

function powermod(base: bigint, exp: bigint, p: bigint): Field {
    var result = 1n;

    while (exp !== 0n) {
      if (exp % 2n === 1n) result = result * base % p;
      base = base * base % p;
      exp >>= 1n;
    }

    return Field(result);
}

const useProof = false;
const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);
const { privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1];
// ----------------------------------------------------
// Create a public/private key pair. The public key is your address and where you deploy the zkApp to
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
// create an instance of Square - and deploy it to zkAppAddress
const zkAppInstance = new Whisper(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkAppInstance.deploy();
});
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// get the initial state of Square after deployment
const p = Field.ORDER;
const merkleMap = new MerkleMap()

merkleMap.set(Poseidon.hash(deployerAccount.toFields()), Field(2n));
merkleMap.set(Poseidon.hash(senderAccount.toFields()), Field(2n));

const initialRoot = merkleMap.getRoot();
const pka = powermod(g, deployerKey.toBigInt(), p);

let txn = await Mina.transaction(deployerAccount, () => {
    zkAppInstance.initState(pka, initialRoot);
});
await txn.prove();
await txn.sign([deployerKey, zkAppPrivateKey]).send();

const pka_state = zkAppInstance.pka.get();
console.log('state after init:', pka_state.toBigInt());

// other participant
const pkb = powermod(g, senderKey.toBigInt(), p);

const common_key = powermod(pka_state.toBigInt(), senderKey.toBigInt(), p);
const common_pk = PrivateKey.fromBigInt(common_key.toBigInt());
const common_puk = common_pk.toPublicKey();

const witness = merkleMap.getWitness(Poseidon.hash(senderAccount.toFields()))

txn = await Mina.transaction(senderAccount, () => {
  zkAppInstance.keyAgreement(witness, pkb, common_puk);
});
await txn.prove();
const pendingTxn = await txn.sign([senderKey]).send();

console.log("common private key:", common_pk.toBase58());
console.log("common public key:", common_puk.toBase58());

const pkb_state = zkAppInstance.pkb.get();
console.log("pkb state:", pkb_state.toBigInt());

const common_key2 = powermod(pkb_state.toBigInt(), deployerKey.toBigInt(), p);
const common_pk2 = PrivateKey.fromBigInt(common_key2.toBigInt());
const common_puk2 = common_pk2.toPublicKey();

console.log("common private key 2:", common_pk2.toBase58());
console.log("common public key 2:", common_puk2.toBase58());

let check: Bool | undefined;

txn = await Mina.transaction(senderAccount, () => {
    check = zkAppInstance.checkPublicKey(common_puk2);
});
await txn.prove();
await txn.sign([senderKey]).send();

console.log("Are publickeys equal:", check?.toBoolean());

const mhh = zkAppInstance.messageHistoryHash.get();
const participants = zkAppInstance.participants.get();

const checker = new Checker(mhh, participants);

let proof = await Prover.baseCase(checker);

const messages: MessageDetails[] = []
const examples = [
  "hello",
  "world",
  "how are you",
  "welcome",
  "to mina blockchain"
]

for (const message of examples) {
  const plain = CircuitString.fromString(message).toFields();
  const cipher = Encryption.encrypt(plain, common_puk);

  const hashedCipher = Poseidon.hash(cipher.cipherText);
  const sig = Signature.create(senderKey, cipher.publicKey.toFields().concat(hashedCipher));

  const messageDetails = new MessageDetails(hashedCipher, cipher.publicKey, sig);

  messages.push(messageDetails);
}

for (const message of messages) {
  proof = await Prover.processMessage(checker, proof, message);
}

console.log(proof.publicOutput);