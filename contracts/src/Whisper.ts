import { Field, SmartContract, state, State, method, PublicKey, Encryption, MerkleMapWitness, Poseidon, createForeignCurve, Crypto, createEcdsa, CircuitString, Bool, ZkProgram, Provable } from 'o1js';
import { Prover } from "./Prover.js";

export const g = 5n;

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class Ecdsa extends createEcdsa(Secp256k1) {}

export const { verificationKey } = await Prover.compile();

class Proof extends ZkProgram.Proof(Prover) {}

export class Whisper extends SmartContract {
  events = {
    "add-pkb": Field
  };

  @state(Field) messageHistoryHash = State<Field>();
  @state(PublicKey) publicKey = State<PublicKey>();
  @state(Field) participants = State<Field>();
  @state(Field) pka = State<Field>();
  @state(Field) pkb = State<Field>();

  @method initState(pka: Field, participants: Field) {
    super.init();
    
    this.pka.set(pka);
    this.participants.set(participants);
  }

  @method keyAgreement(witness: MerkleMapWitness, pkb: Field, publicKey: PublicKey) {
    const participants = this.participants.getAndRequireEquals();
    const senderHash = Poseidon.hash(this.sender.toFields());

    const [root, key] = witness.computeRootAndKey(Field(2n));
    participants.assertEquals(root);
    senderHash.assertEquals(key);

    const puk = this.publicKey.getAndRequireEquals();
    puk.assertEquals(PublicKey.empty());

    this.publicKey.set(publicKey);
    this.pkb.set(pkb);

    this.emitEvent("add-pkb", pkb);
  }

  @method checkPublicKey(publicKey: PublicKey) {
    const puk = this.publicKey.getAndRequireEquals();

    return puk.equals(publicKey);
  }

  @method verifyMessages(proof: Proof) {
    proof.verify();

    const messageHistoryHash = this.messageHistoryHash.getAndRequireEquals();
    const participants = this.participants.getAndRequireEquals();

    const initialHash = proof.publicInput.messageHistory;
    messageHistoryHash.assertEquals(initialHash);
    
    const root = proof.publicInput.participants;
    participants.assertEquals(root);

    const newMessageHistoryHash = proof.publicOutput.newMessageHistory;
    
    this.messageHistoryHash.set(newMessageHistoryHash);
  }
}
