import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot,
  writeBatch, increment, setDoc
} from 'firebase/firestore';
import { db } from './config';

// ─── Generic helpers ──────────────────────────────────────────────────────────
export const getCollection = (col) => getDocs(collection(db, col));
export const getDocById = (col, id) => getDoc(doc(db, col, id));
export const addDocument = (col, data) => addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });
export const updateDocument = (col, id, data) => updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });
export const setDocument = (col, id, data) => setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });
export const deleteDocument = (col, id) => deleteDoc(doc(db, col, id));

// ─── Config ───────────────────────────────────────────────────────────────────
export const getConfig = async (docId) => {
  const snap = await getDoc(doc(db, 'config', docId));
  return snap.exists() ? snap.data() : null;
};
export const setConfig = (docId, data) => setDoc(doc(db, 'config', docId), data, { merge: true });

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUserData = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
export const setUserData = (uid, data) => setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const getClientes = async () => {
  const snap = await getDocs(query(collection(db, 'clientes'), orderBy('nombre')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
export const getClienteById = async (id) => {
  const snap = await getDoc(doc(db, 'clientes', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
export const addCliente = (data) => addDoc(collection(db, 'clientes'), { ...data, createdAt: serverTimestamp() });
export const updateCliente = (id, data) => updateDoc(doc(db, 'clientes', id), { ...data, updatedAt: serverTimestamp() });

// ─── Vehiculos (subcolección de cliente) ─────────────────────────────────────
export const getVehiculos = async (clienteId) => {
  const snap = await getDocs(collection(db, 'clientes', clienteId, 'vehiculos'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
export const addVehiculo = (clienteId, data) =>
  addDoc(collection(db, 'clientes', clienteId, 'vehiculos'), { ...data, createdAt: serverTimestamp() });
export const updateVehiculo = (clienteId, vehiculoId, data) =>
  updateDoc(doc(db, 'clientes', clienteId, 'vehiculos', vehiculoId), { ...data, updatedAt: serverTimestamp() });
export const deleteVehiculo = (clienteId, vehiculoId) =>
  deleteDoc(doc(db, 'clientes', clienteId, 'vehiculos', vehiculoId));

// ─── Inventario ───────────────────────────────────────────────────────────────
export const getInventario = async () => {
  const snap = await getDocs(query(collection(db, 'inventario'), orderBy('nombre')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
export const addInventarioItem = (data) => addDoc(collection(db, 'inventario'), { ...data, createdAt: serverTimestamp() });
export const updateInventarioItem = (id, data) => updateDoc(doc(db, 'inventario', id), { ...data, updatedAt: serverTimestamp() });
export const deleteInventarioItem = (id) => deleteDoc(doc(db, 'inventario', id));
export const adjustInventarioStock = (id, delta) =>
  updateDoc(doc(db, 'inventario', id), { cantidad: increment(delta), updatedAt: serverTimestamp() });

// ─── Ordenes ──────────────────────────────────────────────────────────────────
export const getOrdenes = async () => {
  const snap = await getDocs(query(collection(db, 'ordenes'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
export const getOrdenById = async (id) => {
  const snap = await getDoc(doc(db, 'ordenes', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
export const addOrden = async (data, repuestosInventario = []) => {
  const docRef = await addDoc(collection(db, 'ordenes'), { ...data, createdAt: serverTimestamp() });
  if (repuestosInventario.length > 0) {
    const batch = writeBatch(db);
    repuestosInventario.forEach(({ id, cantidad }) => {
      batch.update(doc(db, 'inventario', id), { cantidad: increment(-cantidad), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
  return docRef;
};
export const updateOrden = (id, data) => updateDoc(doc(db, 'ordenes', id), { ...data, updatedAt: serverTimestamp() });

// ─── Cotizaciones ─────────────────────────────────────────────────────────────
export const getCotizaciones = async () => {
  const snap = await getDocs(query(collection(db, 'cotizaciones'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
export const getCotizacionById = async (id) => {
  const snap = await getDoc(doc(db, 'cotizaciones', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
export const addCotizacion = (data) => addDoc(collection(db, 'cotizaciones'), { ...data, createdAt: serverTimestamp() });
export const updateCotizacion = (id, data) => updateDoc(doc(db, 'cotizaciones', id), { ...data, updatedAt: serverTimestamp() });

// ─── Revisiones ───────────────────────────────────────────────────────────────
export const getRevisiones = async () => {
  const snap = await getDocs(query(collection(db, 'revisiones'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
export const getRevisionById = async (id) => {
  const snap = await getDoc(doc(db, 'revisiones', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
export const addRevision = (data) => addDoc(collection(db, 'revisiones'), { ...data, createdAt: serverTimestamp() });
export const updateRevision = (id, data) => updateDoc(doc(db, 'revisiones', id), { ...data, updatedAt: serverTimestamp() });

// ─── Contadores para numeración ───────────────────────────────────────────────
export const getNextNumber = async (tipo) => {
  const ref = doc(db, 'config', 'contadores');
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const next = (data[tipo] || 0) + 1;
  await setDoc(ref, { [tipo]: next }, { merge: true });
  return next;
};
