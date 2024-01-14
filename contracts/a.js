import { Field, SmartContract, state, State, method, PublicKey, Encryption, PrivateKey } from 'o1js';

function powermod(base, exp, p) {
    var result = 1n;
    while (exp !== 0n) {
      if (exp % 2n === 1n) result = result * base % p;
      base = base * base % p;
      exp >>= 1n;
    }
    return result;
}

const pk1 = PrivateKey.random()
const pk2 = PrivateKey.random()

const g = 5n;
const p = Field.ORDER;

const alice = powermod(g, pk1.toBigInt(), p)
const bob = powermod(g, pk2.toBigInt(), p)

const alice_key = powermod(bob, pk1.toBigInt(), p)
const bob_key = powermod(alice, pk2.toBigInt(), p)

const common_pk = PrivateKey.fromBigInt(alice_key)
const common_puk = common_pk.toPublicKey()

console.log (common_pk.toBase58(), common_puk.toBase58())
/*
    11562101312693737956285003604374935506643959194196385323244734903722495329607n
    11562101312693737956285003604374935506643959194196385323244734903722495329607n
*/