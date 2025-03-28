import React, { useRef } from 'react';
import '../styles/TransactionReceipt.css';

function TransactionReceipt({ transaction, userData, onClose, onPrint }) {
  const receiptRef = useRef(null);
  
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };
  
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  
  const receiptNumber = `R${Math.floor(100000 + Math.random() * 900000)}`;
  
  
  const handlePrint = () => {
    const content = receiptRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Transaction Receipt</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              background-color: white;
              color: black;
            }
            .receipt {
              border: 1px dashed #000;
              padding: 20px;
              background-color: white;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .receipt-logo {
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 5px;
            }
            .receipt-title {
              font-weight: bold;
              margin: 10px 0;
              text-align: center;
              font-size: 16px;
            }
            .receipt-content {
              margin: 15px 0;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 13px;
            }
            .receipt-label {
              flex: 1;
            }
            .receipt-value {
              flex: 1;
              text-align: right;
              font-weight: bold;
            }
            .receipt-divider {
              border-top: 1px dashed #000;
              margin: 12px 0;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 15px;
              font-size: 12px;
              border-top: 1px dashed #000;
              padding-top: 12px;
            }
            .amount {
              font-weight: bold;
            }
            .receipt-thank-you {
              text-align: center;
              margin-top: 15px;
              font-weight: bold;
            }
            .receipt-barcode {
              font-family: monospace;
              text-align: center;
              font-size: 14px;
              margin-top: 10px;
              letter-spacing: 2px;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    
    setTimeout(() => {
      printWindow.print();
      
      if (onPrint) onPrint();
    }, 300);
  };

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal">
        <div className="receipt-container">
          <div className="receipt" ref={receiptRef}>
            <div className="receipt-header">
              <div className="receipt-logo">SILICON BANK</div>
              <div>TRANSACTION RECEIPT</div>
              <div>{formatDate(transaction.date || new Date())}</div>
            </div>
            
            <div className="receipt-title">
              {transaction.type.toUpperCase()}
            </div>
            
            <div className="receipt-content">
              <div className="receipt-row">
                <div className="receipt-label">CARD NUMBER:</div>
                <div className="receipt-value">XXXX XXXX XXXX {userData.cardNumber.slice(-4)}</div>
              </div>
              
              <div className="receipt-row">
                <div className="receipt-label">ACCOUNT:</div>
                <div className="receipt-value">{userData.accountType.toUpperCase()}</div>
              </div>
              
              <div className="receipt-row">
                <div className="receipt-label">ACCOUNT #:</div>
                <div className="receipt-value">{userData.accountNumber}</div>
              </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row">
                <div className="receipt-label">TRANSACTION TYPE:</div>
                <div className="receipt-value">{transaction.type.toUpperCase()}</div>
              </div>
              
              <div className="receipt-row">
                <div className="receipt-label">AMOUNT:</div>
                <div className="receipt-value amount">{formatCurrency(transaction.amount)}</div>
              </div>
              
              {transaction.toAccount && (
                <div className="receipt-row">
                  <div className="receipt-label">TO ACCOUNT:</div>
                  <div className="receipt-value">{transaction.toAccount}</div>
                </div>
              )}
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row">
                <div className="receipt-label">TRANSACTION ID:</div>
                <div className="receipt-value">{transaction.transactionId}</div>
              </div>
              
              <div className="receipt-row">
                <div className="receipt-label">RECEIPT #:</div>
                <div className="receipt-value">{receiptNumber}</div>
              </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row">
                <div className="receipt-label">AVAILABLE BALANCE:</div>
                <div className="receipt-value amount">{formatCurrency(userData.balance)}</div>
              </div>
            </div>
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-footer">
              This is your electronic receipt.
              Please keep for your records.
            </div>
            
            <div className="receipt-thank-you">
              THANK YOU FOR BANKING WITH US
            </div>
            
            <div className="receipt-barcode">
              *{transaction.transactionId}*
            </div>
          </div>
        </div>
        
        <div className="receipt-actions">
          <button className="print-btn" onClick={handlePrint}>
            Print Receipt
          </button>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionReceipt;