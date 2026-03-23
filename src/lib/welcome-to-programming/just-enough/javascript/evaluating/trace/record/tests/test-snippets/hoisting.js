// Targets: hoist var, hoist function
x = 10;
var x;
hello();
function hello() {
	return 'hi';
}
