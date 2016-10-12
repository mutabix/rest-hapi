var assert = require("assert");

module.exports = {
  /**
   * Assert that a given model follows the mongoose model format.
   * @param model
   * @param Log
   * @returns {boolean}
   */
  validateModel: function(model, Log) {
    assert(model.schema, "model not mongoose format. 'schema' property required.");
    assert(model.schema.paths, "model not mongoose format. 'schema.paths' property required.");

    var fields = model.schema.paths;
    var fieldNames = Object.keys(fields);

    assert(model.schema.methods, "model not mongoose format. 'schema.methods' property required.");

    for (var i = 0; i < fieldNames.length; i++) {
      var fieldName = fieldNames[i];
      assert(fields[fieldName].options, "field not mongoose format. 'options' parameter required.");
    }

    return true;
  }
};
