const logger = require('../config/logger');

class Pagination {
  /**
   * Obtém parâmetros de paginação da query string
   * @param {Object} query - Query parameters
   * @param {Object} defaults - Valores padrão
   * @returns {Object} Parâmetros de paginação
   */
  static get(query = {}, defaults = {}) {
    const limit = Math.min(
      parseInt(query.limit) || defaults.limit || 10,
      defaults.maxLimit || 100
    );
    
    const offset = Math.max(
      parseInt(query.offset) || defaults.offset || 0,
      0
    );

    const page = Math.max(
      parseInt(query.page) || defaults.page || 1,
      1
    );

    // Calcular offset baseado na página se fornecido
    const calculatedOffset = query.page ? (page - 1) * limit : offset;

    const pagination = {
      limit,
      offset: calculatedOffset,
      page,
    };

    logger.debug('Parâmetros de paginação calculados', {
      query,
      defaults,
      pagination,
    });

    return pagination;
  }

  /**
   * Calcula metadados de paginação
   * @param {number} total - Total de itens
   * @param {number} limit - Limite por página
   * @param {number} offset - Offset atual
   * @returns {Object} Metadados de paginação
   */
  static getMetadata(total, limit, offset) {
    const pages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    const hasNext = currentPage < pages;
    const hasPrev = currentPage > 1;
    const nextPage = hasNext ? currentPage + 1 : null;
    const prevPage = hasPrev ? currentPage - 1 : null;

    return {
      total,
      limit,
      offset,
      pages,
      currentPage,
      hasNext,
      hasPrev,
      nextPage,
      prevPage,
    };
  }

  /**
   * Cria resposta paginada padronizada
   * @param {Array} items - Array de itens
   * @param {number} total - Total de itens
   * @param {Object} pagination - Parâmetros de paginação
   * @returns {Object} Resposta paginada
   */
  static createResponse(items, total, pagination) {
    const metadata = this.getMetadata(total, pagination.limit, pagination.offset);

    return {
      items,
      pagination: metadata,
    };
  }

  /**
   * Valida parâmetros de paginação
   * @param {Object} query - Query parameters
   * @param {Object} options - Opções de validação
   * @returns {Object} Parâmetros validados
   */
  static validate(query = {}, options = {}) {
    const {
      defaultLimit = 10,
      maxLimit = 100,
      minLimit = 1,
      defaultOffset = 0,
      minOffset = 0,
    } = options;

    let limit = parseInt(query.limit);
    let offset = parseInt(query.offset);
    let page = parseInt(query.page);

    // Validar e ajustar limit
    if (isNaN(limit) || limit < minLimit) {
      limit = defaultLimit;
    }
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    // Validar e ajustar offset
    if (isNaN(offset) || offset < minOffset) {
      offset = defaultOffset;
    }

    // Validar e ajustar page
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    // Se page foi fornecido, calcular offset
    if (query.page) {
      offset = (page - 1) * limit;
    }

    const validated = {
      limit,
      offset,
      page,
    };

    logger.debug('Parâmetros de paginação validados', {
      query,
      options,
      validated,
    });

    return validated;
  }

  /**
   * Cria links de paginação para API
   * @param {Object} metadata - Metadados de paginação
   * @param {string} baseUrl - URL base
   * @param {Object} query - Query parameters originais
   * @returns {Object} Links de paginação
   */
  static createLinks(metadata, baseUrl, query = {}) {
    const { currentPage, pages, hasNext, hasPrev, nextPage, prevPage } = metadata;
    
    const createUrl = (page) => {
      const params = new URLSearchParams({
        ...query,
        page: page.toString(),
      });
      return `${baseUrl}?${params.toString()}`;
    };

    const links = {
      self: createUrl(currentPage),
      first: createUrl(1),
      last: createUrl(pages),
    };

    if (hasNext) {
      links.next = createUrl(nextPage);
    }

    if (hasPrev) {
      links.prev = createUrl(prevPage);
    }

    return links;
  }

  /**
   * Aplica paginação a uma query do Sequelize
   * @param {Object} query - Query do Sequelize
   * @param {Object} pagination - Parâmetros de paginação
   * @returns {Object} Query com paginação aplicada
   */
  static applyToQuery(query, pagination) {
    return {
      ...query,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  /**
   * Cria middleware para extrair parâmetros de paginação
   * @param {Object} defaults - Valores padrão
   * @returns {Function} Middleware function
   */
  static middleware(defaults = {}) {
    return (req, res, next) => {
      req.pagination = this.get(req.query, defaults);
      next();
    };
  }

  /**
   * Formata resposta de paginação para frontend
   * @param {Array} data - Dados paginados
   * @param {Object} metadata - Metadados de paginação
   * @param {Object} links - Links de paginação
   * @returns {Object} Resposta formatada
   */
  static formatResponse(data, metadata, links = {}) {
    return {
      data,
      meta: {
        pagination: metadata,
        links,
      },
    };
  }

  /**
   * Calcula estatísticas de paginação
   * @param {number} total - Total de itens
   * @param {number} limit - Limite por página
   * @param {number} offset - Offset atual
   * @returns {Object} Estatísticas
   */
  static getStats(total, limit, offset) {
    const startItem = offset + 1;
    const endItem = Math.min(offset + limit, total);
    const isEmpty = total === 0;
    const isFirstPage = offset === 0;
    const isLastPage = offset + limit >= total;

    return {
      startItem,
      endItem,
      isEmpty,
      isFirstPage,
      isLastPage,
      totalItems: total,
      itemsPerPage: limit,
      currentOffset: offset,
    };
  }
}

module.exports = Pagination;

