import Head from "next/head";
import { SERVER_URL } from "../../../config";
import { runQuery } from "../../../data/adaptor/indexed";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useRouter } from "next/router";

export default function QueryRenderPage() {
  const [tables, setTables] = useState([]);
  const router = useRouter();
  const { queryId } = router.query;

  async function loadQuery() {
    try {
      const targetQuery = await getQuery(queryId);

      if (!targetQuery) {
        return null;
      }

      const targetApplication = await getApplication(targetQuery.appId);

      if (!targetQuery.queryString || !targetApplication) {
        return null;
      }

      const queryResponse = await runQuery(
        targetQuery.queryString,
        targetApplication.connectionConfig
      );

      const parsedQueryResponse = queryResponse?.map((qr_) => ({
        data: qr_?.result,
        headers: qr_?.result.length > 0 ? Object.keys(qr_?.result[0]) : [],
      }));

      return parsedQueryResponse;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  useEffect(() => {
    loadQuery()
      .then((tableData) => {
        if (!tableData) {
          return null;
        }
        if (tableData?.length > 0) {
          setTables(
            tableData.map((table_construct) => ({
              columns: table_construct.headers.map((table_header) => ({
                name: table_header,
                selector: (row) => row[table_header],
              })),
              data: table_construct?.data,
            }))
          );
        }
      })
      .catch((table_data_load_err) => {
        console.log(table_data_load_err);
        return null;
      });
  }, [queryId]);
  return (
    <>
      <Head></Head>
      <div className="app-content" style={{ padding: "10px" }}>
        {tables?.map((table_instance, ix) => (
          <DataTable
            columns={table_instance?.columns ?? []}
            data={table_instance?.data ?? []}
            key={ix}
          />
        ))}
      </div>
    </>
  );
}

export const getQuery = async (id) => {
  try {
    const response = await fetch(
      `${SERVER_URL}:4000/backend/index.php/api/getQuery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }), // Replace with your desired data to send
      }
    );

    const data = await response.json();

    const query = JSON.parse(data?.queryData?.query).queryJSON;

    return { ...query, id: data?.queryData?.id ?? "_" };
  } catch (e) {
    console.log(e);
    Notification.error({
      title: "Server Connection Error",
    });
  }
};

const getApplication = async (id) => {
  try {
    const response = await fetch(
      `${SERVER_URL}:4000/backend/index.php/api/getApplication`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }), // Replace with your desired data to send
      }
    );

    const data = await response.json();

    const app = {
      ...JSON.parse(data?.applicationData?.application).appJSON,
      id: data?.applicationData?.id ?? "_",
    };

    return app;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export async function getServerSideProps(ctx) {
  try {
    const { queryId } = ctx.query;

    if (!queryId) {
      return {
        props: {},
      };
    }

    const targetQuery = await getQuery(queryId);

    if (!targetQuery) {
      return {
        props: {},
      };
    }

    const targetApplication = await getApplication(targetQuery.appId);

    if (!targetQuery.queryString || !targetApplication) {
      return {
        props: {},
      };
    }

    const queryResponse = await runQuery(
      targetQuery.queryString,
      targetApplication.connectionConfig
    );

    const parsedQueryResponse = queryResponse?.map((qr_) => ({
      data: qr_?.result,
      headers: qr_?.result.length > 0 ? Object.keys(qr_?.result[0]) : [],
    }));

    return {
      props: {
        queryId,
        tableData: parsedQueryResponse,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {},
    };
  }
}
