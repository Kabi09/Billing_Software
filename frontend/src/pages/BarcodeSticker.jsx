import React, { useRef } from "react";
import Barcode from "react-barcode";

const BarcodeSticker = ({ product, onClose }) => {
  const stickerRef = useRef();

  const handlePrint = () => {
    // 1. Get the HTML content of the sticker
    const content = stickerRef.current.innerHTML;
    
    // 2. Open a new window for printing
    const printWindow = window.open('', '', 'width=600,height=600');
    
    // 3. Write the content and styles to the new window
    printWindow.document.write('<html><head><title>Print Label</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      @page { 
        size: 56mm auto; 
        margin: 0; 
      }
      body { 
        margin: 0; 
        display: flex; 
        justify-content: center; 
        align-items: flex-start; 
        background-color: white;
      }
      .sticker-container { 
        width: 56mm; 
        padding: 4px; 
        text-align: center; 
        font-family: sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .prod-name { 
        font-size: 12px; 
        font-weight: bold; 
        margin-bottom: 2px; 
        width: 100%;
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis; 
      }
      .prod-price { 
        font-size: 16px; 
        font-weight: 900; 
        margin: 2px 0; 
      }
      /* Hide regular SVG text if needed, or style it */
      svg {
        max-width: 100%;
      }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<div class="sticker-container">' + content + '</div>');
    printWindow.document.write('</body></html>');
    
    // 4. Trigger Print
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    // Modal Overlay Styles
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", 
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      
      {/* Modal Content */}
      <div style={{
        backgroundColor: "white", padding: "20px", borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)", minWidth: "300px", textAlign: "center"
      }}>
        <h3 style={{ marginBottom: "15px", fontSize: "18px", fontWeight: "600" }}>Barcode Label (56mm)</h3>
        
        {/* --- Sticker Preview Area (This part will be printed) --- */}
        <div 
          ref={stickerRef} 
          style={{ 
            width: "56mm", 
            minHeight: "30mm",
            border: "1px dashed #ccc", 
            padding: "5px", 
            margin: "0 auto", 
            textAlign: "center", 
            background: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
            <div className="prod-name" style={{fontSize: '12px', fontWeight: 'bold', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {product.name}
            </div>
            
            <div className="prod-price" style={{fontSize: '16px', fontWeight: '900', margin:'2px 0'}}>
              Rs. {product.price}
            </div>
            
            <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <Barcode 
                  value={product.barcode} 
                  width={1.5} 
                  height={40} 
                  fontSize={12} 
                  displayValue={true} 
                  margin={0}
                />
            </div>
        </div>
        {/* ------------------------------------------------------- */}

        <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
           <button 
             onClick={handlePrint}
             style={{
               padding: "10px 20px", background: "#2563eb", color: "white", 
               border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600"
             }}
           >
             Print Label
           </button>
           
           <button 
             onClick={onClose}
             style={{
               padding: "10px 20px", background: "#e5e7eb", color: "#374151", 
               border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600"
             }}
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeSticker;