const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

function leerArchivosXMLEnDirectorio(directorio, callback) {

    fs.readdir(directorio, (err, archivos) => {
      if (err) {
        return callback(err);
      }
  
      const archivosXML = archivos.filter(archivo => path.extname(archivo).toLowerCase() === '.xml');
      const resultado = {};

      archivosXML.forEach(archivo => {
        const rutaArchivo = path.join(directorio, archivo);
  
        fs.readFile(rutaArchivo, 'utf-8', (err, contenido) => {
          if (err) {
            console.error(`Error al leer el archivo ${rutaArchivo}:`, err);
            return;
          }
  
          xml2js.parseString(contenido, (err, xmlParseado) => {
            if (err) {
              console.error(`Error al analizar el XML ${rutaArchivo}:`, err);
              return;
            }
  
            // Inicializa el objeto resultado para este archivo
            const nombreArchivo = path.basename(archivo, '.xml');
            resultado[nombreArchivo] = [];
  
            // Itera sobre todos los elementos <liquidacion>
            xmlParseado.estadodecuenta.liquidaciones[0].liquidacion.forEach(liquidacion => {
                const num_liq = liquidacion.$.num_liq || ""; // Si num_liq no está presente, establece un valor vacío
              
                // Verifica si existen facturas dentro de la liquidación
                if (liquidacion.facturas && liquidacion.facturas[0] && liquidacion.facturas[0].factura) {
                  const totalMonto = liquidacion.facturas[0].factura.reduce((total, factura) => {
                    // Verifica si existen conceptos dentro de la factura
                    if (factura.conceptos && factura.conceptos[0] && factura.conceptos[0].concepto) {
                      // Suma los montos totales de todos los conceptos de la factura
                      return total + factura.conceptos[0].concepto.reduce((subtotal, concepto) => {
                        // Verifica si existe un monto total dentro del concepto
                        if (concepto.monto_total && concepto.monto_total[0]) {
                          // Suma el monto total al subtotal
                          return subtotal + parseFloat(concepto.monto_total[0]);
                        } else {
                          return subtotal;
                        }
                      }, 0);
                    } else {
                      return total;
                    }
                  }, 0);
              
                  // Agrega un objeto con los datos de la liquidación al resultado
                  resultado[nombreArchivo].push({
                    num_liq: num_liq,
                    monto_total: totalMonto
                  });
                }
              });
  
            // Llamada al callback si ya se checaron todos los xml
            if (Object.keys(resultado).length === archivosXML.length) {
              callback(null, resultado);
              guardarjson(resultado, callback);
            }
          });
        });
      });
    });
}

function guardarjson(json, callback){
    const contenido = JSON.stringify(json, null, 2); //identacion de 2 espacios del JSON

    fs.writeFile('resultado.json', contenido, 'utf-8', err => {
        if(err){
            return callback(err);
        }
        console.log('JSON guardado correctamente en resultado.json');
        callback(null);
    })
}

const directorio = './XML_files';

leerArchivosXMLEnDirectorio(directorio, (err, archivos) => {
    if (err) {
      console.error('Error al leer los archivos XML:', err);
      return;
    }
    if(archivos==null){
        console.log('Termino Ejecucion');
    }else{
        console.log('Contenido de los archivos XML:', archivos);
    }
    
  });
  


