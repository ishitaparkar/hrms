import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DocumentsSection from '../DocumentsSection';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

describe('DocumentsSection', () => {
  const mockDocuments = [
    {
      id: 1,
      name: 'ID Card.pdf',
      category: 'Personal',
      fileType: 'pdf',
      fileSize: 1024000,
      uploadDate: '2025-01-15',
      status: 'Verified'
    },
    {
      id: 2,
      name: 'Contract.pdf',
      category: 'Employment',
      fileType: 'pdf',
      fileSize: 2048000,
      uploadDate: '2025-01-10',
      status: 'Verified'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    // Reset document.body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  test('displays documents when loaded', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: mockDocuments })
    });

    render(<DocumentsSection employeeId={1} />);

    await waitFor(() => {
      expect(screen.getByText('ID Card.pdf')).toBeInTheDocument();
    });
  });

  test('displays empty state when no documents', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: [] })
    });

    render(<DocumentsSection employeeId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/No documents available/i)).toBeInTheDocument();
    });
  });

  test('filters documents by category', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: mockDocuments })
    });

    render(<DocumentsSection employeeId={1} />);

    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('ID Card.pdf')).toBeInTheDocument();
    });

    // Click on Employment tab
    const employmentTab = screen.getByRole('tab', { name: 'Employment' });
    fireEvent.click(employmentTab);

    // Should show Employment document
    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
      expect(screen.queryByText('ID Card.pdf')).not.toBeInTheDocument();
    });
  });

  test('downloads document when download button is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: mockDocuments })
    });

    render(<DocumentsSection employeeId={1} />);

    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('ID Card.pdf')).toBeInTheDocument();
    });

    // Mock the download response
    const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob
    });

    // Mock document.createElement and appendChild
    const mockLink = {
      click: jest.fn(),
      href: '',
      download: ''
    };
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    // Click download button
    const downloadButtons = screen.getAllByLabelText(/Download/i);
    fireEvent.click(downloadButtons[0]);

    // Wait for download to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/employees/1/documents/1/download/',
        expect.objectContaining({
          headers: {
            'Authorization': 'Token mock-token'
          }
        })
      );
    });

    // Verify download was triggered
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.download).toBe('ID Card.pdf');

    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  test('displays error when document download fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ documents: mockDocuments })
    });

    render(<DocumentsSection employeeId={1} />);

    // Wait for documents to load
    await waitFor(() => {
      expect(screen.getByText('ID Card.pdf')).toBeInTheDocument();
    });

    // Mock failed download response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    // Click download button
    const downloadButtons = screen.getAllByLabelText(/Download/i);
    fireEvent.click(downloadButtons[0]);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to download ID Card.pdf/i)).toBeInTheDocument();
    });
  });
});
