import { useState } from 'react';

function buildInitialValues(fields) {
  const values = {};
  fields.forEach((field) => {
    values[field.name] = '';
  });
  return values;
}

function buildPayload(fields, values) {
  const payload = {};
  fields.forEach((field) => {
    if (field.type === 'lines') {
      payload[field.name] = values[field.name]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    } else {
      payload[field.name] = values[field.name];
    }
  });
  return payload;
}

function AiFeatureForm({ feature, onSubmit, submitting }) {
  const [values, setValues] = useState(() => buildInitialValues(feature.fields));

  function update(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(buildPayload(feature.fields, values));
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      {feature.fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="label-text">
            {field.label}
          </label>
          {field.type === 'textarea' || field.type === 'lines' ? (
            <textarea
              id={field.name}
              rows={field.type === 'lines' ? 5 : 4}
              value={values[field.name]}
              onChange={(e) => update(field.name, e.target.value)}
              placeholder={field.placeholder}
              required
              className="input-field resize-none"
            />
          ) : (
            <input
              id={field.name}
              type="text"
              value={values[field.name]}
              onChange={(e) => update(field.name, e.target.value)}
              placeholder={field.placeholder}
              required
              className="input-field"
            />
          )}
        </div>
      ))}
      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
        {submitting ? 'Asking AI…' : `Get ${feature.title}`}
      </button>
    </form>
  );
}

export default AiFeatureForm;
