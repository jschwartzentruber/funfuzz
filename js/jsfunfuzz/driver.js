function start(glob)
{
  getListOfMakers(glob);

  var fuzzSeed = Math.floor(Math.random() * Math.pow(2,28));
  dumpln("fuzzSeed: " + fuzzSeed);
  Random.init(fuzzSeed);

  mathInitFCM();

  count = 0;

  if (jsshell) {
    // If another script specified a "maxRunTime" argument, use it; otherwise, run forever
    var MAX_TOTAL_TIME = (glob.maxRunTime) || (Infinity);
    var startTime = new Date();

    do {
      testOne();
      var elapsed1 = new Date() - lastTime;
      if (elapsed1 > 1000) {
        print("That took " + elapsed1 + "ms!");
      }
      var lastTime = new Date();
    } while(lastTime - startTime < MAX_TOTAL_TIME);
  } else {
    setTimeout(testStuffForAWhile, 200);
  }
}

function testStuffForAWhile()
{
  for (var j = 0; j < 100; ++j)
    testOne();

  if (count % 10000 < 100)
    printImportant("Iterations: " + count);

  setTimeout(testStuffForAWhile, 30);
}

function testOne()
{
  var dumpEachSeed = false; // Can be set to true if makeStatement has side effects, such as crashing, so you have to reduce "the hard way".
  ++count;
  // Split this string across two source strings to ensure that if a
  // generated function manages to output the entire jsfunfuzz source,
  // that output won't match the grep command.
  var cookie = "/*F";
  cookie += "RC*/";

  // Sometimes it makes sense to start with simpler functions:
  //var depth = ((count / 1000) | 0) & 16;
  var depth = 14;

  if (dumpEachSeed) {
    // More complicated, but results in a much shorter script, making SpiderMonkey happier.
    var MTA = uneval(Random.twister.export_mta());
    var MTI = Random.twister.export_mti();
    if (MTA != Random.lastDumpedMTA) {
      dumpln(cookie + "Random.twister.import_mta(" + MTA + ");");
      Random.lastDumpedMTA = MTA;
    }
    dumpln(cookie + "Random.twister.import_mti(" + MTI + "); void (makeOv(" + depth + "));");
  }

  var code = makeOv(depth);

  if (count == 1 && engine == ENGINE_SPIDERMONKEY_TRUNK && rnd(5)) {
    code = "tryRunning = useSpidermonkeyShellSandbox(" + rnd(4) + ");";
    //print("Sane mode!")
  }

//  if (rnd(10) === 1) {
//    var dp = "/*infloop-deParen*/" + Random.index(deParen(code));
//    if (dp)
//      code = dp;
//  }
  dumpln(cookie + "count=" + count + "; tryItOut(" + uneval(code) + ");");

  tryItOut(code);
}


function failsToCompileInTry(code) {
  // Why would this happen? One way is "let x, x"
  try {
    new Function(" try { " + code + " } catch(e) { }");
    return false;
  } catch(e) {
    return true;
  }
}

