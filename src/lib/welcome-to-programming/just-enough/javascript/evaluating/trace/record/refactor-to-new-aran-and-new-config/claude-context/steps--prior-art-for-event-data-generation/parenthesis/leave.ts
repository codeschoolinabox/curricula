// for now assume configuring parenthesis means counting steps, these can be decoupled later if there's a need

function leaveParenthesis() {
  return {
    category: 'parenthesis',
    kind: 'leave',
    count: null, // TODO
  };
}

export default leaveParenthesis;
