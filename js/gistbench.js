var testCount = 1;

CodeMirror.defaults.theme = 'solarized dark';

var setupCode = CodeMirror.fromTextArea(document.getElementById('setup-code'));
var testCases = [new CodeMirror(function(){}), CodeMirror.fromTextArea(document.getElementById('test-case-1-code'))];
var output = CodeMirror.fromTextArea(document.getElementById('test-output'));

document.getElementById('add-test').addEventListener('click', function(e) {
  e.preventDefault();
  testCount++;
  var testNode = document.getElementById("test-case-1").cloneNode(true);
  testNode.removeChild(testNode.querySelector('.CodeMirror'));
  testNode.querySelector('legend').textContent = 'Test ' + testCount;
  var name = testNode.querySelector('input#test-case-1-name');
  name.id = 'test-case-' + testCount + '-name';
  var input = testNode.querySelector('textarea');
  input.id = 'test-case-' + testCount + '-code';
  testCases[testCount] = CodeMirror.fromTextArea(input);
  var labels = testNode.querySelectorAll('label');
  labels[0].htmlFor = 'test-case-' + testCount + '-name';
  labels[1].htmlFor = 'test-case-' + testCount + '-code';
  this.parentNode.insertBefore(testNode, this);
});

document.getElementById('run-tests').addEventListener('click', function(e) {
  e.preventDefault();

  var loopCount = parseInt(document.getElementById('loop-count').value, 10);

  if (loopCount % 10) {
    alert('Oh noes! Loopcount has to be a multiple of ten to enable clean loop unrolling. kthxbye.');
    return;
  }

  var setupCode = document.getElementById('setup-code').value;

  var names = [];
  var tests = [];
  var times = [];
  var results = [];

  for (var i = 0; i <= testCount; i++) {
    var testName = document.getElementById('test-case-' + i + '-name').value;
    var testCode = testCases[i].getValue();
    var test = createTest(testName, testCode, i, loopCount);
    if (!test)
      return;
    tests.push(test);
    results.push('gistBench' + i + 'Result');
    times.push('gistBench' + i + 'Duration');
    names.push('"' + testName + '"');
  }

  var code = harnessTemplate
             .split('%loops%').join(loopCount)
             .split('%names%').join(names.join(',\n  '))
             .split('%setup%').join(setupCode)
             .split('%times%').join(times.join())
             .split('%warmup%').join(createTest('Warmup', '', 'Warmup', loopCount / 10))
             .split('%results%').join(results.join())
             .split('%tests%').join(tests.join('\n\n'));

  console.log(code);
  output.setValue(code);
  // document.getElementById('test-output').value = code;
});

function createTest(name, code, index, loops) {
  var forbiddenWords = code.match(/(gistBench\w+)/);
  if (forbiddenWords) {
    alert('Oh noes! Your code in test ' + index + ' confuses me: it contains the string "' + forbiddenWords[1] + '". This, it must not. kthxbye.');
    return;
  }
  code = '  ' + code.split('\r\n').join('\n').split('\n').join('\n  ');
  return (testTemplate
          .split('%index%').join(index)
          .split('%loops%').join(loops / 10)
          .split('%name%').join(name || 'unnamed')
          .split('%code%').join(code));
}

var harnessTemplate = '// gistbench v0.1 (http://gistbench.com)\n// Loops: %loops%\n\nvar testNames = [\n  %names%\n];\n\n' + 
                      '// Setup\n%setup%\n\nfunction gistBenchMain() {\n\n// Warmup (ignore)\n%warmup%\n\n%tests%\n\n' + 
                      'return {\n  results : [%results%],\n  times : [%times%]\n};\n} // gistBenchMain\n\n' + 
                      'var out = typeof console !== "undefined" ? console.log : print;\n\n' + 
                      'var results = gistBenchMain();\nvar baseline = results.times.shift();\ntestNames.shift();\n' +
                      'out("Baseline-performance for empty test: " + baseline + "ms");\n' +
                      'out("Results, with baseline subtracted:");' +
                      'results.times.forEach(function(result, i) {' + 
                      '\n    out("Test " + i + ": " + (result - baseline) + "ms\\t\\t" + testNames[i]);\n});';

var testTemplate = '\n\n// Test%index% (%name%)\nfunction gistBench%index%() {\n%code%\n}\nvar gistBench%index%Result = 0;\n' +
                   'var gistBench%index%Begin = Date.now();\n' +
                   'for (var gistBenchLoops = %loops%; gistBenchLoops--;) {\n  gistBench%index%Result |=\n' + 
                   new Array(10).join('    gistBench%index%() |\n') + 
                   '    0;\n}\nvar gistBench%index%Duration = Date.now() - gistBench%index%Begin;';