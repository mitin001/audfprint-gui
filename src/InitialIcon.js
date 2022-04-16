import React from 'react';

export default function InitialIcon(props) {
  const { text, borderStyle = 'inset' } = props || {};
  return (
    <div
      style={{
        height: '25px',
        width: '25px',
        fontSize: '13px',
        lineHeight: '22px',
        borderRadius: '50%',
        display: 'inline-block',
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.54)',
        borderWidth: '2.5px',
        borderColor: 'white',
        borderStyle,
      }}
    >
      {`${text[0]}`}
    </div>
  );
}
