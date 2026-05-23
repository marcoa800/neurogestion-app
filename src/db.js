import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Surgeries ─────────────────────────────────────────────────

export function subscribeSurgeries(cb, onError) {
  const q = query(collection(db, 'surgeries'), orderBy('date', 'desc'))
  return onSnapshot(q,
    snap => cb(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
    onError,
  )
}

export async function addSurgery(data) {
  const { id: _id, ...rest } = data
  await addDoc(collection(db, 'surgeries'), { ...rest, createdAt: serverTimestamp() })
}

export async function updateSurgery(id, data) {
  const { id: _id, ...rest } = data
  await updateDoc(doc(db, 'surgeries', id), rest)
}

export async function deleteSurgery(id) {
  await deleteDoc(doc(db, 'surgeries', id))
}

// ── Suppliers ─────────────────────────────────────────────────

export function subscribeSuppliers(cb) {
  return onSnapshot(collection(db, 'suppliers'),
    snap => cb(snap.docs.map(d => ({ ...d.data(), id: d.id })))
  )
}

export async function addSupplier(data) {
  const { id: _id, ...rest } = data
  await addDoc(collection(db, 'suppliers'), rest)
}

export async function updateSupplier(id, data) {
  const { id: _id, ...rest } = data
  await updateDoc(doc(db, 'suppliers', id), rest)
}

export async function deleteSupplier(id) {
  await deleteDoc(doc(db, 'suppliers', id))
}

// ── Seeding inicial (solo si las colecciones están vacías) ────

export async function seedIfEmpty(mockSurgeries, initialSuppliers) {
  const [surgSnap, supSnap] = await Promise.all([
    getDocs(collection(db, 'surgeries')),
    getDocs(collection(db, 'suppliers')),
  ])
  const tasks = []
  if (surgSnap.empty) {
    for (const s of mockSurgeries) {
      const { id: _id, ...rest } = s
      tasks.push(addDoc(collection(db, 'surgeries'), { ...rest, createdAt: serverTimestamp() }))
    }
  }
  if (supSnap.empty) {
    for (const s of initialSuppliers) {
      const { id: _id, ...rest } = s
      tasks.push(addDoc(collection(db, 'suppliers'), rest))
    }
  }
  await Promise.all(tasks)
}
