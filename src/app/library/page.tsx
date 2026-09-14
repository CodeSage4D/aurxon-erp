'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import {
  BookOpen,
  Search,
  Plus,
  Bookmark,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function LibraryPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'circulation' | 'elibrary'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Add Book Form
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCategory, setNewCategory] = useState('Physics');
  const [newCopies, setNewCopies] = useState('10');
  const [newShelf, setNewShelf] = useState('Shelf A-2, Rack 1');

  // Issue Book Form
  const [selectedAccession, setSelectedAccession] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerId, setBorrowerId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [meRes, libRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/library'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (libRes.ok) {
          const lJson = await libRes.json();
          setData(lJson);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;

    const newBook = {
      id: `book-${Date.now()}`,
      accessionNumber: `ACC-2024-${String((data?.catalog?.length || 0) + 1).padStart(3, '0')}`,
      title: newTitle,
      author: newAuthor,
      isbn: newIsbn || '978-0000000000',
      category: newCategory,
      rackLocation: newShelf,
      totalCopies: parseInt(newCopies, 10),
      availableCopies: parseInt(newCopies, 10),
      publisher: 'Academic Press',
      edition: 'Latest Edition',
    };

    setData((prev: any) => ({
      ...prev,
      catalog: [newBook, ...(prev?.catalog || [])],
      stats: {
        ...prev?.stats,
        totalTitles: (prev?.stats?.totalTitles || 0) + 1,
        totalVolumes: (prev?.stats?.totalVolumes || 0) + parseInt(newCopies, 10),
        availableStock: (prev?.stats?.availableStock || 0) + parseInt(newCopies, 10),
      },
    }));

    setShowAddBookModal(false);
    setNewTitle('');
    setNewAuthor('');
    setNewIsbn('');
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccession || !borrowerName) return;

    const book = data?.catalog?.find((b: any) => b.accessionNumber === selectedAccession);
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const newLoan = {
      id: `loan-${Date.now()}`,
      accessionNumber: selectedAccession,
      bookTitle: book?.title || 'Selected Book',
      borrowerName,
      borrowerId: borrowerId || 'ADM-2024-NEW',
      borrowerRole: 'STUDENT',
      issueDate,
      dueDate,
      status: 'ISSUED',
      fineAccrued: 0,
    };

    setData((prev: any) => ({
      ...prev,
      loans: [newLoan, ...(prev?.loans || [])],
      catalog: (prev?.catalog || []).map((b: any) =>
        b.accessionNumber === selectedAccession ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
      ),
      stats: {
        ...prev?.stats,
        currentlyIssued: (prev?.stats?.currentlyIssued || 0) + 1,
        availableStock: Math.max(0, (prev?.stats?.availableStock || 0) - 1),
      },
    }));

    setShowIssueModal(false);
    setSelectedAccession('');
    setBorrowerName('');
    setBorrowerId('');
  };

  const handleReturnBook = (loanId: string, accessionNo: string) => {
    setData((prev: any) => ({
      ...prev,
      loans: (prev?.loans || []).filter((l: any) => l.id !== loanId),
      catalog: (prev?.catalog || []).map((b: any) =>
        b.accessionNumber === accessionNo ? { ...b, availableCopies: b.availableCopies + 1 } : b
      ),
      stats: {
        ...prev?.stats,
        currentlyIssued: Math.max(0, (prev?.stats?.currentlyIssued || 0) - 1),
        availableStock: (prev?.stats?.availableStock || 0) + 1,
      },
    }));
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#0284c7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading Library Circulation & Catalog...</p>
        </div>
      </div>
    );
  }

  const filteredCatalog = (data?.catalog || []).filter((b: any) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || b.category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
                <BookOpen size={20} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Library & Circulation Desk
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 46px' }}>
              Accession register, barcode circulation, book loans, fine ledger & digital learning resources
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowIssueModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={15} />
              <span>Issue Book</span>
            </button>
            <button
              onClick={() => setShowAddBookModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={15} />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unique Titles</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{data?.stats?.totalTitles || 6} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Titles</span></div>
            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>All Subjects Covered</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Physical Volumes</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0c4a6e', marginTop: '6px' }}>{data?.stats?.totalVolumes || 109} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Books</span></div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>In Main Central Library</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currently Issued</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>{data?.stats?.currentlyIssued || 3} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Loans</span></div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>Standard 14 Days Term</div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue Returns</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: (data?.stats?.overdueLoans || 0) > 0 ? '#b91c1c' : '#16a34a', marginTop: '6px' }}>
              {data?.stats?.overdueLoans || 1} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Overdue</span>
            </div>
            <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>Fine: ₹5/day automated</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'catalog' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'catalog' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <BookOpen size={16} />
            <span>Catalog & Accession Register</span>
          </button>
          <button
            onClick={() => setActiveTab('circulation')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'circulation' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'circulation' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={16} />
            <span>Circulation Desk ({data?.loans?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('elibrary')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'elibrary' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'elibrary' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={16} />
            <span>Digital E-Library & NCERT</span>
          </button>
        </div>

        {/* TAB 1: CATALOG */}
        {activeTab === 'catalog' && (
          <div>
            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['ALL', 'Physics', 'Mathematics', 'Chemistry', 'Biology', 'Literature', 'Social'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: selectedCategory === cat ? '#0284c7' : '#e2e8f0',
                      backgroundColor: selectedCategory === cat ? '#f0f9ff' : '#ffffff',
                      color: selectedCategory === cat ? '#0284c7' : '#475569',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Table */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                      <th style={{ padding: '12px 16px' }}>Accession No</th>
                      <th style={{ padding: '12px 16px' }}>Book Title & Edition</th>
                      <th style={{ padding: '12px 16px' }}>Author / Publisher</th>
                      <th style={{ padding: '12px 16px' }}>Category</th>
                      <th style={{ padding: '12px 16px' }}>Rack Location</th>
                      <th style={{ padding: '12px 16px' }}>Availability</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.map((book: any) => (
                      <tr key={book.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                          {book.accessionNumber}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{book.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>ISBN: {book.isbn} • {book.edition}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155' }}>
                          <div>{book.author}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{book.publisher}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                            {book.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12.5px' }}>
                          {book.rackLocation}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: book.availableCopies > 0 ? '#047857' : '#b91c1c',
                              backgroundColor: book.availableCopies > 0 ? '#ecfdf5' : '#fef2f2',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {book.availableCopies} / {book.totalCopies} Available
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            disabled={book.availableCopies === 0}
                            onClick={() => {
                              setSelectedAccession(book.accessionNumber);
                              setShowIssueModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: book.availableCopies > 0 ? '#ffffff' : '#f1f5f9',
                              color: book.availableCopies > 0 ? '#0284c7' : '#94a3b8',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: book.availableCopies > 0 ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Issue
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CIRCULATION DESK */}
        {activeTab === 'circulation' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Active Lending Ledger</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Borrower records, due dates and late fine tracking</p>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Default Loan Period: <strong>14 Days</strong>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                    <th style={{ padding: '12px 16px' }}>Accession No</th>
                    <th style={{ padding: '12px 16px' }}>Book Title</th>
                    <th style={{ padding: '12px 16px' }}>Borrower & Role</th>
                    <th style={{ padding: '12px 16px' }}>Issue Date</th>
                    <th style={{ padding: '12px 16px' }}>Due Date</th>
                    <th style={{ padding: '12px 16px' }}>Status & Late Fine</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.loans || []).map((loan: any) => (
                    <tr key={loan.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                        {loan.accessionNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {loan.bookTitle}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{loan.borrowerName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{loan.borrowerRole} • ID: {loan.borrowerId}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{loan.issueDate}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: loan.status === 'OVERDUE' ? '#b91c1c' : '#334155' }}>
                        {loan.dueDate}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: loan.status === 'OVERDUE' ? '#fef2f2' : '#ecfdf5',
                            color: loan.status === 'OVERDUE' ? '#b91c1c' : '#047857',
                          }}
                        >
                          {loan.status} {loan.fineAccrued > 0 ? `(Fine: ₹${loan.fineAccrued})` : ''}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleReturnBook(loan.id, loan.accessionNumber)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#16a34a',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Receive & Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DIGITAL E-LIBRARY */}
        {activeTab === 'elibrary' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {[
              {
                title: 'NCERT Exemplar Class 10 & 12',
                subject: 'Science & Mathematics',
                type: 'CBSE Curriculum E-Book',
                size: '14.2 MB',
                badge: 'Official NEP',
              },
              {
                title: 'Indian National Science Olympiad Papers',
                subject: 'Physics, Chemistry, Astronomy',
                type: 'Archived Question Papers',
                size: '8.4 MB',
                badge: 'Olympiad',
              },
              {
                title: 'Dictionary of Classical & Modern Sanskrit',
                subject: 'Language & Heritage',
                type: 'Reference Lexicon',
                size: '22.0 MB',
                badge: 'Reference',
              },
              {
                title: 'Python for School Artificial Intelligence (Class 11-12)',
                subject: 'Computer Science',
                type: 'Interactive Code Companion',
                size: '6.8 MB',
                badge: 'Computer Science',
              },
            ].map((res, rIdx) => (
              <div
                key={rIdx}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f0f9ff', color: '#0369a1' }}>
                    {res.badge}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{res.size}</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>{res.title}</h4>
                <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '16px' }}>{res.subject} • {res.type}</div>
                <button
                  onClick={() => alert(`Downloading ${res.title}...`)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #0284c7',
                    backgroundColor: '#ffffff',
                    color: '#0284c7',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Access Digital Resource
                </button>
              </div>
            ))}
          </div>
        )}

        {/* MODAL: ADD BOOK */}
        {showAddBookModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add Book to Catalog</h3>
                <button onClick={() => setShowAddBookModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddBook}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Book Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fundamentals of Physics"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Author</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Halliday"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Subject Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="Physics">Physics</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Literature">Literature</option>
                      <option value="Social Science">Social Science</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Total Copies</label>
                    <input
                      type="number"
                      required
                      value={newCopies}
                      onChange={(e) => setNewCopies(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Shelf / Rack</label>
                    <input
                      type="text"
                      value={newShelf}
                      onChange={(e) => setNewShelf(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddBookModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                    Catalog Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ISSUE BOOK */}
        {showIssueModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Issue Book to Student / Faculty</h3>
                <button onClick={() => setShowIssueModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleIssueBook}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Select Book Accession</label>
                  <select
                    required
                    value={selectedAccession}
                    onChange={(e) => setSelectedAccession(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="">-- Choose available book --</option>
                    {(data?.catalog || []).filter((b: any) => b.availableCopies > 0).map((b: any) => (
                      <option key={b.accessionNumber} value={b.accessionNumber}>
                        {b.accessionNumber}: {b.title} ({b.availableCopies} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Borrower Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Admission / Employee No</label>
                    <input
                      type="text"
                      placeholder="ADM-2024-101"
                      value={borrowerId}
                      onChange={(e) => setBorrowerId(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '12px', color: '#0369a1', marginBottom: '20px' }}>
                  Book will be issued for 14 calendar days. Late return fine of ₹5.00/day will automatically trigger after the due date.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowIssueModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                    Confirm & Issue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
