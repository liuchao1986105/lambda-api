const tools = require('../utils/tools');

module.exports = function(schema) {
  schema.methods.update_at_ago = function() {
    return tools.formatDate(this.updated_at, true);
  };
  schema.methods.create_at_ago = function() {
    return tools.formatDate(this.created_at, true);
  };
};
