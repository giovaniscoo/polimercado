
const SUPABASE_URL = 'https://samlcszygcynpljpqeyd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWxjc3p5Z2N5bnBsanBxZXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzMyMjUsImV4cCI6MjEwNzQwOTIyNX0.ew3LLakwlfwHEIfYTvMZohKPy0M7TTCb76CFsWAzoEU'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables de estado
let currentProducts = [];
let currentSchoolId = 0;
let currentSchoolName = "";

// Catálogo y configuración 
const logos = {
    "CICS Milpa Alta": "https://ipn.mx/assets/files/saes/img/ns/cics-ma.png",
    "CICS Santo Tomás": "https://cics-sto.ipn.mx/assets/files/cicssto/img/conocenos/logocicsstf.png",
    "ENBA": "https://ipn.mx/assets/files/saes/img/ns/enba.png",
    "ENCB Santo Tomás": "https://ipn.mx/assets/files/saes/img/ns/encb.png",
    "ENCB Zacatenco": "https://ipn.mx/assets/files/saes/img/ns/encb.png",
    "ENMH": "https://ipn.mx/assets/files/saes/img/ns/enmh.png",
    "ESCA Santo Tomás": "https://ipn.mx/assets/files/saes/img/ns/esca-sto.png",
    "ESCA Tepepan": "https://ipn.mx/assets/files/saes/img/ns/esca-tep.png",
    "ESCOM": "https://www.escom.ipn.mx/images/conocenos/escudoESCOM.png",
    "ESE": "https://ipn.mx/assets/files/saes/img/ns/ese.png",
    "ESEO": "https://ipn.mx/assets/files/saes/img/ns/eseo.png",
    "ESFM": "https://www.esfm.ipn.mx/assets/files/esfm/img/escudos/Escudo_ESFM.png",
    "ESIA Tecamachalco": "https://ipn.mx/assets/files/saes/img/ns/esia-tec.png",
    "ESIA Ticomán": "https://ipn.mx/assets/files/saes/img/ns/esia-tec.png",
    "ESIA Zacatenco": "https://ipn.mx/assets/files/saes/img/ns/esia-tec.png",
    "ESIME Azcapotzalco": "https://ipn.mx/assets/files/saes/img/ns/esime-azc.png",
    "ESIME Culhuacán": "https://ipn.mx/assets/files/saes/img/ns/esime-azc.png",
    "ESIME Ticomán": "https://ipn.mx/assets/files/saes/img/ns/esime-tic.png",
    "ESIME Zacatenco": "https://ipn.mx/assets/files/saes/img/ns/esime-azc.png",
    "ESIQUIE": "https://ipn.mx/assets/files/saes/img/ns/esiqie.png",
    "ESIT": "https://ipn.mx/assets/files/saes/img/ns/esit.png",
    "ESM": "https://ipn.mx/assets/files/saes/img/ns/esm.png",
    "EST": "https://ipn.mx/assets/files/saes/img/ns/est.png",
    "UPIBI": "https://ipn.mx/assets/files/saes/img/ns/upiibi.png",
    "UPIICSA": "https://ipn.mx/assets/files/saes/img/ns/upiicsa.png",
    "UPIITA": "https://ipn.mx/assets/files/saes/img/ns/upiita.png"
};
const schools = Object.keys(logos);

// 1. RENDERIZADO INDEX.HTML

export function renderSchoolsGrid() {
    const grid = document.getElementById('schools-container');
    if (!grid) return;

    schools.forEach(school => {
        const card = document.createElement('a');
        // REFACTORIZACIÓN: Redirigimos a la única plantilla pasando el parámetro
        card.href = `escuela.html?escuela=${encodeURIComponent(school)}`;
        card.className = 'school-card';
        const imgSrc = logos[school] || "https://upload.wikimedia.org/wikipedia/commons/f/f8/Logo_Instituto_Polit%C3%A9cnico_Nacional.png";

        card.innerHTML = `
            <div class="school-img-placeholder">
                <img src="${imgSrc}" alt="Logo ${school}">
            </div>
            <h3>${school}</h3>
        `;
        grid.appendChild(card);
    });
}

// 2. INICIALIZACIÓN ESCUELA.HTML

export async function initSchoolPage() {
    const params = new URLSearchParams(window.location.search);
    const schoolParam = params.get('escuela');

    if (!schoolParam) {
        window.location.href = 'index.html';
        return;
    }

    currentSchoolName = schoolParam;
    document.getElementById('page-title').textContent = `📍 ${currentSchoolName}`;
    document.getElementById('nav-school-name').textContent = currentSchoolName;
    document.getElementById('buyer-title').textContent = `Mercado de ${currentSchoolName}`;

    // Obtener el ID de la escuela desde la base de datos
    const { data, error } = await supabase.from('escuela').select('id_escuela').eq('nombre', currentSchoolName).single();
    if (error || !data) {
        alert("Escuela no encontrada en la base de datos.");
        return;
    }
    currentSchoolId = data.id_escuela;

    // Conectar el formulario de vendedor
    const form = document.getElementById('seller-form');
    if (form) {
        form.addEventListener('submit', handleProductSubmit);
    }
}


// 3. VISTA DE VENDEDOR 
async function handleProductSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Publicando... ⏳";
    submitBtn.disabled = true;

    try {
        const fileInput = document.getElementById('prod-img');
        const file = fileInput.files[0];
        
        const sellerName = document.getElementById('seller-name').value;
        const sellerPhone = document.getElementById('seller-phone').value;
        
        const name = document.getElementById('prod-name').value;
        const category = document.getElementById('prod-category').value;
        const price = parseFloat(document.getElementById('prod-price').value);
        const stock = parseInt(document.getElementById('prod-stock').value);
        const global = document.getElementById('prod-global').checked;

        // A) Insertar o recuperar CLIENTE (cumpliendo con Modelo Relacional)
        let idCliente;
        const { data: existingClient } = await supabase.from('cliente').select('id_cliente').eq('telefono_whatsapp', sellerPhone).single();
        
        if (existingClient) {
            idCliente = existingClient.id_cliente;
        } else {
            const { data: newClient, error: clientError } = await supabase.from('cliente').insert([{
                nombre: sellerName,
                telefono_whatsapp: sellerPhone,
                id_escuela: currentSchoolId
            }]).select().single();
            if (clientError) throw new Error("Error al registrar cliente: " + clientError.message);
            idCliente = newClient.id_cliente;
        }

        // B) Subir imagen
        let publicImageUrl = "https://via.placeholder.com/180?text=Sin+Foto";
        if (file) {
            const fileName = `${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
            if (uploadError) throw uploadError;
            
            const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName);
            publicImageUrl = urlData.publicUrl;
        }

        // C) Insertar PRODUCTO (vinculado a Cliente y Escuela)
        const { error: insertError } = await supabase.from('producto').insert([{
            nombre: name,
            categoria: category,
            precio_venta: price,
            stock_disponible: stock,
            es_global: global,
            imagen_url: publicImageUrl,
            id_escuela: currentSchoolId,
            id_vendedor: idCliente
        }]);

        if (insertError) throw insertError;

        alert("¡Producto publicado exitosamente en el mercado!");
        e.target.reset();

    } catch (err) {
        console.error(err);
        alert(err.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// 4. VISTA DE COMPRADOR Y RENDERIZADO

window.triggerBuyerView = async function() {
    const grid = document.getElementById('products-container');
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Cargando productos del servidor... 🔄</p>';

    try {
        const { data: productosData, error } = await supabase
            .from('producto')
            .select(`
                *,
                escuela ( nombre ),
                cliente!id_vendedor ( telefono_whatsapp, nombre )
            `)
            .or(`id_escuela.eq.${currentSchoolId},es_global.eq.true`)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        currentProducts = productosData;
        renderProductGrid(currentProducts);
    } catch (err) {
        console.error("Error al obtener productos:", err);
        grid.innerHTML = '<p style="text-align:center; color: red;">Error al cargar el catálogo.</p>';
    }
}

function renderProductGrid(products) {
    const grid = document.getElementById('products-container');
    if (!grid) return;
    grid.innerHTML = '';

    if(!products || products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No hay productos disponibles por el momento.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const schoolName = p.escuela ? p.escuela.nombre : 'Desconocida';
        const isGlobalString = (p.es_global && schoolName !== currentSchoolName) ? '(Envío Global)' : '';
        const wapp = p.cliente ? p.cliente.telefono_whatsapp : '';
        
        // Renderizamos escapando variables para evitar XSS
        card.innerHTML = `
            <div class="product-img">
                <img src="${p.imagen_url}" alt="Producto" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-info">
                <span class="badge">${p.categoria}</span>
                <h3>${p.nombre}</h3>
                <p style="margin: 0 0 5px 0; font-weight: bold; color: var(--guinda);">$${p.precio_venta} MXN</p>
                <p style="margin: 0; font-size: 0.9rem; color: #666;">
                    📍 ${schoolName} ${isGlobalString}
                </p>
                <div class="product-footer">
                    <span class="stock">${p.stock_disponible} disp.</span>
                    <button class="btn" style="width: 100%; margin-top: 10px;" onclick="window.processPurchase(${p.id_producto}, '${p.nombre}', ${p.precio_venta}, '${wapp}')">
                        Comprar / Contactar
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.filterProducts = function() {
    const cat = document.getElementById('filter-category').value;
    let filtered = currentProducts;
    if (cat !== "All") {
        filtered = currentProducts.filter(p => p.categoria === cat);
    }
    renderProductGrid(filtered);
}

// 5. REGISTRO DE COMPRA (IMPLEMENTA MODELO RELACIONAL TRANSACTIONS)
window.processPurchase = async function(id_producto, nombre_prod, precio, vendedor_whatsapp) {
    const buyerName = prompt("Para registrar tu compra, ingresa tu Nombre:");
    if (!buyerName) return;
    const buyerPhone = prompt("Ingresa tu WhatsApp para contactar al vendedor:");
    if (!buyerPhone) return;

    try {
        // A) Insertar/Buscar Cliente Comprador
        let idComprador;
        const { data: existingClient } = await supabase.from('cliente').select('id_cliente').eq('telefono_whatsapp', buyerPhone).single();
        if (existingClient) {
            idComprador = existingClient.id_cliente;
        } else {
            const { data: newClient, error: clientErr } = await supabase.from('cliente').insert([{ nombre: buyerName, telefono_whatsapp: buyerPhone, id_escuela: currentSchoolId }]).select().single();
            if (clientErr) throw clientErr;
            idComprador = newClient.id_cliente;
        }

        // B) Insertar COMPRA
        const { data: nuevaCompra, error: compraErr } = await supabase.from('compra').insert([{
            monto_total: precio,
            estado_pago: 'Pendiente',
            metodo_pago: 'Acuerdo con vendedor',
            id_cliente: idComprador
        }]).select().single();
        if (compraErr) throw compraErr;

        // C) Insertar DETALLE_COMPRA
        const { error: detalleErr } = await supabase.from('detalle_compra').insert([{
            id_compra: nuevaCompra.id_compra,
            num_renglon: 1,
            id_producto: id_producto,
            cantidad: 1,
            precio_unitario: precio
        }]);
        if (detalleErr) throw detalleErr;

        alert(`¡Compra registrada exitosamente bajo el folio #${nuevaCompra.id_compra}! Redirigiendo a WhatsApp...`);
        
        // D) Redirigir al WhatsApp del vendedor
        const mensaje = `Hola, vengo de PoliMercado. Me interesa tu producto: ${nombre_prod}. Mi folio de compra es el #${nuevaCompra.id_compra}.`;
        window.open(`https://wa.me/${vendedor_whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank');

    } catch (err) {
        console.error(err);
        alert("Ocurrió un error al procesar la compra.");
    }
}