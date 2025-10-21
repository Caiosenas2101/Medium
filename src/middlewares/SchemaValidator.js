const logger = require('../config/logger');

class SchemaValidator {
  /**
   * Middleware para validar dados de entrada usando Yup
   * @param {Object} schema - Schema Yup para validação
   * @param {string} source - Fonte dos dados ('body', 'query', 'params')
   * @returns {Function} Middleware function
   */
  static validate(schema, source = 'body') {
    return async (req, res, next) => {
      try {
        const data = req[source];
        
        // Validar dados usando o schema
        const validatedData = await schema.validate(data, {
          abortEarly: false, // Retorna todos os erros, não apenas o primeiro
          stripUnknown: true, // Remove campos não definidos no schema
        });

        // Adicionar dados validados ao request
        req.data = validatedData;
        req.filter = validatedData; // Para compatibilidade com filtros

        // Log de validação bem-sucedida
        logger.debug(`Validação bem-sucedida para ${source}:`, {
          endpoint: req.path,
          method: req.method,
          validatedFields: Object.keys(validatedData),
        });

        next();
      } catch (error) {
        // Se for erro de validação do Yup
        if (error.name === 'ValidationError') {
          const errors = error.errors.map(err => ({
            field: err.path || 'unknown',
            message: err.message,
          }));

          logger.warn(`Erro de validação em ${req.path}:`, {
            method: req.method,
            source,
            errors,
          });

          return res.status(400).json({
            status: 'error',
            type_error: 'VALIDATION_ERROR',
            message: 'Dados de entrada inválidos',
            errors,
          });
        }

        // Se for outro tipo de erro
        logger.error(`Erro inesperado na validação em ${req.path}:`, error);
        
        return res.status(500).json({
          status: 'error',
          type_error: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
        });
      }
    };
  }

  /**
   * Middleware para validar múltiplas fontes de dados
   * @param {Object} schemas - Objeto com schemas para cada fonte
   * @returns {Function} Middleware function
   */
  static validateMultiple(schemas) {
    return async (req, res, next) => {
      try {
        const validatedData = {};

        // Validar cada fonte especificada
        for (const [source, schema] of Object.entries(schemas)) {
          if (schema && req[source]) {
            const data = await schema.validate(req[source], {
              abortEarly: false,
              stripUnknown: true,
            });
            validatedData[source] = data;
          }
        }

        // Adicionar dados validados ao request
        req.data = validatedData;
        req.filter = validatedData;

        logger.debug(`Validação múltipla bem-sucedida:`, {
          endpoint: req.path,
          method: req.method,
          validatedSources: Object.keys(validatedData),
        });

        next();
      } catch (error) {
        if (error.name === 'ValidationError') {
          const errors = error.errors.map(err => ({
            field: err.path || 'unknown',
            message: err.message,
          }));

          logger.warn(`Erro de validação múltipla em ${req.path}:`, {
            method: req.method,
            errors,
          });

          return res.status(400).json({
            status: 'error',
            type_error: 'VALIDATION_ERROR',
            message: 'Dados de entrada inválidos',
            errors,
          });
        }

        logger.error(`Erro inesperado na validação múltipla em ${req.path}:`, error);
        
        return res.status(500).json({
          status: 'error',
          type_error: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
        });
      }
    };
  }

  /**
   * Middleware para validar apenas se os dados existem (sem validação de schema)
   * @param {string} source - Fonte dos dados
   * @returns {Function} Middleware function
   */
  static requireData(source = 'body') {
    return (req, res, next) => {
      if (!req[source] || Object.keys(req[source]).length === 0) {
        logger.warn(`Dados obrigatórios não fornecidos em ${req.path}:`, {
          method: req.method,
          source,
        });

        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: `Dados obrigatórios não fornecidos em ${source}`,
        });
      }

      req.data = req[source];
      req.filter = req[source];
      next();
    };
  }
}

module.exports = SchemaValidator;

