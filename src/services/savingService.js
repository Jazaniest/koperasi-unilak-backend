const { Saving, Member, User } = require('../models')
const { generateId } = require('../utils/generateId')

const SAVING_TYPE_LABELS = {
    pokok: 'Simpanan Pokok',
    wajib: 'Simpanan Wajib',
    sukarela: 'Simpanan Sukarela',
}

/**
 * Ambil semua transaksi simpanan (untuk bendahara / admin)
 * dengan info nama & nomor anggota
 */
async function getAllSavingsTransactions() {
    const savings = await Saving.findAll({
        include: [
            {
                model: Member,
                as: 'member',
                attributes: ['id', 'memberNumber'],
                include: [{ model: User, as: 'user', attributes: ['name'] }],
            },
        ],
        order: [['date', 'DESC']],
    })

    return savings.map((s) => {
        const raw = s.toJSON()
        return {
            ...raw,
            memberName: raw.member?.user?.name ?? '—',
            memberNumber: raw.member?.memberNumber ?? '—',
        }
    })
}

/**
 * Ambil simpanan milik satu anggota, dengan summary per tipe
 */
async function getMemberSavings(memberId) {
    const records = await Saving.findAll({
        where: { memberId },
        order: [['date', 'DESC']],
    })

    const byType = { pokok: 0, wajib: 0, sukarela: 0 }
    for (const r of records) {
        if (byType[r.type] !== undefined) byType[r.type] += Number(r.amount)
    }

    return {
        records: records.map((r) => r.toJSON()),
        byType,
        total: Object.values(byType).reduce((a, b) => a + b, 0),
    }
}

/**
 * Tambah transaksi simpanan (oleh bendahara / admin)
 */
async function addSavingsTransaction({ memberId, type, amount, description }) {
    const member = await Member.findByPk(memberId)
    if (!member) return { success: false, error: 'Anggota tidak ditemukan' }

    if (!['pokok', 'wajib', 'sukarela'].includes(type)) {
        return { success: false, error: 'Tipe simpanan tidak valid' }
    }

    const saving = await Saving.create({
        id: generateId('sv'),
        memberId,
        type,
        amount: Number(amount),
        date: new Date().toISOString().slice(0, 10),
        description: description || SAVING_TYPE_LABELS[type],
    })

    return { success: true, saving }
}

module.exports = {
    getAllSavingsTransactions,
    getMemberSavings,
    addSavingsTransaction,
    SAVING_TYPE_LABELS,
}